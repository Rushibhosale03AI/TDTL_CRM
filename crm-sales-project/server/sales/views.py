from rest_framework import viewsets, mixins, status, generics
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Count, Sum, Q
from django.http import HttpResponse
from django.contrib.auth import get_user_model
import pandas as pd
import io

from accounts.permissions import IsAdminRole, IsManagerRole, IsManagerOrAdmin
from .models import (
    Team, Lead, Contact, Deal, Activity, ImportJob, Task,
    AdminPanelSetting, ManagerPanelSetting, SalesPanelSetting,
    Document, ActivityLog, Notification, EveningReport
)
from .serializers import (
    TeamSerializer, LeadSerializer, ContactSerializer, 
    DealSerializer, ActivitySerializer, ImportJobSerializer, TaskSerializer,
    AdminPanelSettingSerializer, ManagerPanelSettingSerializer, SalesPanelSettingSerializer,
    DocumentSerializer, ActivityLogSerializer, NotificationSerializer, EveningReportSerializer
)
from .dashboard import admin_dashboard_data, manager_dashboard_data, sales_dashboard_data
from .notifications import create_activity_log, create_notification
from .reports import generate_sales_report
from .services import process_lead_import

User = get_user_model()


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    queryset = Team.objects.all().select_related("manager").prefetch_related("members")
    
    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return self.queryset
        if user.role == "MANAGER":
            # Show teams they manage OR created
            return self.queryset.filter(Q(manager=user) | Q(created_by=user)).distinct()
        # Sales can view teams they belong to OR manage (if they are a Team Head)
        return self.queryset.filter(Q(members=user) | Q(manager=user)).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    queryset = Lead.objects.all().select_related("owner", "created_by").prefetch_related("contacts", "deals")
    filterset_fields = ["status", "source", "owner"]
    search_fields = ["name", "email", "company", "phone", "industry", "location"]
    ordering_fields = ["name", "created_at", "status", "value"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.filter(is_deleted=False)
        if user.role == "ADMIN":
            return qs
        if user.role == "MANAGER":
            # Manager sees their own leads + leads of their team members
            team_member_ids = User.objects.filter(sales_teams__manager=user).values_list("id", flat=True)
            return qs.filter(Q(owner=user) | Q(owner__id__in=team_member_ids))
        # Sales sees only their own
        return qs.filter(owner=user)

    def perform_create(self, serializer):
        # Default owner to self if not provided
        owner = serializer.validated_data.get('owner', self.request.user)
        serializer.save(created_by=self.request.user, owner=owner)

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def import_excel(self, request):
        """Endpoint to upload Excel files for lead import."""
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": True, "message": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not file_obj.name.endswith(".xlsx"):
            return Response({"error": True, "message": "Only .xlsx files are supported."}, status=status.HTTP_400_BAD_REQUEST)

        job = ImportJob.objects.create(
            uploaded_by=request.user,
            filename=file_obj.name,
            status=ImportJob.StatusChoices.PENDING
        )
        
        # In production, this should be deferred to a Celery worker
        process_lead_import(job, file_obj)
        
        job.refresh_from_db()
        return Response(ImportJobSerializer(job).data, status=status.HTTP_202_ACCEPTED)

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        try:
            # Retrieve active base leads query set
            leads = self.get_queryset()
            
            # Allow exporting ALL records (ignoring role boundaries) for admin/manager if requested
            export_all = request.query_params.get('export_all', 'false').lower() == 'true'
            if export_all and request.user.role in ['ADMIN', 'MANAGER']:
                leads = Lead.objects.filter(is_deleted=False)

            # 1. Date filters (Date-wise, Daily/Monthly reports)
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            if start_date:
                leads = leads.filter(Q(created_at__date__gte=start_date) | Q(updated_at__date__gte=start_date))
            if end_date:
                leads = leads.filter(Q(created_at__date__lte=end_date) | Q(updated_at__date__lte=end_date))

            # 2. Employee filter (Employee-wise records)
            employee_id = request.query_params.get('employee_id')
            if employee_id:
                leads = leads.filter(owner_id=employee_id)

            # 3. Team filter (Team-wise records)
            team_id = request.query_params.get('team_id')
            if team_id:
                from .models import Team
                team = Team.objects.filter(id=team_id).first()
                if team:
                    leads = leads.filter(owner__in=team.members.all())

            # 4. Status filter
            status_param = request.query_params.get('status')
            if status_param:
                normalized_status = status_param.strip().lower()
                status_match = None
                for choice in Lead.StatusChoices.choices:
                    if choice[1].lower() == normalized_status or choice[0].lower() == normalized_status:
                        status_match = choice[1]
                        break
                    if choice[1].lower().replace(' ', '') == normalized_status.replace(' ', ''):
                        status_match = choice[1]
                        break
                if status_match:
                    leads = leads.filter(status=status_match)
                else:
                    leads = leads.filter(status__icontains=status_param)

            # 5. Search parameter matching
            search_param = request.query_params.get('search')
            if search_param:
                from django.db.models import Q
                leads = leads.filter(
                    Q(name__icontains=search_param) |
                    Q(company__icontains=search_param) |
                    Q(email__icontains=search_param) |
                    Q(phone__icontains=search_param)
                )

            # Optimized loading to prevent server bottlenecks on large sheets
            leads = leads.select_related("owner")

            data = []
            # Export in chronological order so daily sheets append naturally
            for lead in leads.order_by('created_at'):
                cf = lead.custom_fields or {}
                # Resolve AE Assigned: owner name or from custom_fields
                ae_assigned = ""
                if lead.owner:
                    ae_assigned = lead.owner.get_full_name() or lead.owner.email
                else:
                    ae_assigned = cf.get('AE Assigned', '')

                # Ensure dates are formatted for Excel
                created_date = lead.created_at.isoformat() if getattr(lead, 'created_at', None) else ''
                imported_date = lead.imported_at.isoformat() if getattr(lead, 'imported_at', None) else ''
                imported_by = lead.imported_by.get_full_name() if getattr(lead, 'imported_by', None) else ''

                data.append({
                    'Contact Name': lead.name or '',
                    'Company Name': lead.company or '',
                    'Email Address': lead.email or '',
                    'Contact No': lead.phone or '',
                    'Designation': lead.designation or '',
                    'Meeting Date': cf.get('Meeting Date', ''),
                    'AE Assigned': ae_assigned,
                    'Status (Completed / Rescheduled / No Show)': lead.status or 'Yet to approach',
                    'Outcome (Qualified / Not Qualified / Follow-up)': cf.get('Outcome (Qualified / Not Qualified / Follow-up)', 'Follow-up'),
                    'Linkedin Connect': lead.linkedin_url or cf.get('Linkedin Connect', ''),
                    'Demo Call': cf.get('Demo Call', 'NO'),
                    'Proposal Sent': cf.get('Proposal Sent', 'N/A'),
                    'Closures': cf.get('Closures', 'N/A'),
                    'Created Date': created_date,
                    'Imported Date': imported_date,
                    'Imported By': imported_by,
                })
            
            df = pd.DataFrame(data)
            
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Leads Export')
                
                # Auto-fit column widths with extra padding to make them wider
                from openpyxl.utils import get_column_letter
                worksheet = writer.sheets['Leads Export']
                for col in worksheet.columns:
                    max_len = 0
                    for cell in col:
                        val = str(cell.value or '')
                        # Handle split lines
                        for line in val.split('\n'):
                            if len(line) > max_len:
                                max_len = len(line)
                    col_letter = get_column_letter(col[0].column)
                    # Generous padding of 5 chars, minimum width of 22 chars, maximum of 65 chars
                    worksheet.column_dimensions[col_letter].width = min(max(max_len + 5, 22), 65)

                # Dynamically set dropdown ranges based on rows size to support massive datasets
                max_row = max(len(data) + 200, 5000)

                # Embed Premium Excel Data Validation Dropdowns
                from openpyxl.worksheet.datavalidation import DataValidation

                # 1. Status Dropdown (Column H)
                status_dv = DataValidation(
                    type="list",
                    formula1='"Completed,Rescheduled,No Show,Yet to approach,In process"',
                    allow_blank=True
                )
                worksheet.add_data_validation(status_dv)
                status_dv.add(f"H2:H{max_row}")

                # 2. Outcome Dropdown (Column I)
                outcome_dv = DataValidation(
                    type="list",
                    formula1='"Qualified,Not Qualified,Follow-up"',
                    allow_blank=True
                )
                worksheet.add_data_validation(outcome_dv)
                outcome_dv.add(f"I2:I{max_row}")

                # 3. Demo Call Dropdown (Column K)
                demo_dv = DataValidation(
                    type="list",
                    formula1='"YES,NO,N/A"',
                    allow_blank=True
                )
                worksheet.add_data_validation(demo_dv)
                demo_dv.add(f"K2:K{max_row}")

                # 4. Proposal Sent Dropdown (Column L)
                proposal_dv = DataValidation(
                    type="list",
                    formula1='"YES,NO,N/A"',
                    allow_blank=True
                )
                worksheet.add_data_validation(proposal_dv)
                proposal_dv.add(f"L2:L{max_row}")

                # 5. Closures Dropdown (Column M)
                closures_dv = DataValidation(
                    type="list",
                    formula1='"YES,NO,N/A"',
                    allow_blank=True
                )
                worksheet.add_data_validation(closures_dv)
                closures_dv.add(f"M2:M{max_row}")

                # Add Import Job history as a separate sheet so past uploads remain visible
                try:
                    import_jobs = ImportJob.objects.select_related('uploaded_by').order_by('-created_at')[:500]
                    jobs_data = []
                    for job in import_jobs:
                        jobs_data.append({
                            'Filename': job.filename,
                            'Uploaded By': job.uploaded_by.get_full_name() if job.uploaded_by else (job.uploaded_by.email if job.uploaded_by else ''),
                            'Status': job.status,
                            'Created At': job.created_at.isoformat() if getattr(job, 'created_at', None) else '',
                            'Summary': str(job.summary or '')
                        })
                    jobs_df = pd.DataFrame(jobs_data)
                    jobs_df.to_excel(writer, index=False, sheet_name='Import History')
                    notes_ws = writer.sheets['Import History']
                    for col in notes_ws.columns:
                        max_len = 0
                        for cell in col:
                            val = str(cell.value or '')
                            if len(val) > max_len:
                                max_len = len(val)
                        col_letter = get_column_letter(col[0].column)
                        notes_ws.column_dimensions[col_letter].width = min(max(max_len + 5, 18), 65)
                except Exception:
                    # Non-fatal: if import job sheet fails, continue with primary export
                    pass
            
            output.seek(0)
            exported_count = len(data)

            # Diagnostic logging to help debug missing rows reported by users
            try:
                logger.info(f"EXPORT: user={request.user.id} exported_count={exported_count}")
            except Exception:
                pass

            response = HttpResponse(
                output.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename=leads_export_{exported_count}.xlsx'
            # Expose exported count in a response header for easy inspection in browser DevTools
            response['X-Exported-Count'] = str(exported_count)
            return response
        except Exception as e:
            import traceback
            print(f"EXPORT ERROR: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": str(e), "traceback": traceback.format_exc()}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def download_template(self, request):
        """Returns a blank Excel template with the correct headers matching the company's Excel sheet."""
        columns = [
            'Contact Name',
            'Company Name',
            'Email Address',
            'Contact No',
            'Designation',
            'Meeting Date',
            'AE Assigned',
            'Status (Completed / Rescheduled / No Show)',
            'Outcome (Qualified / Not Qualified / Follow-up)',
            'Linkedin Connect',
            'Demo Call',
            'Proposal Sent',
            'Closures'
        ]
        df = pd.DataFrame(columns=columns)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Lead Import Template')
            
            # Auto-fit column widths based on headers with extra padding
            from openpyxl.utils import get_column_letter
            worksheet = writer.sheets['Lead Import Template']
            for col in worksheet.columns:
                max_len = 0
                for cell in col:
                    val = str(cell.value or '')
                    if len(val) > max_len:
                        max_len = len(val)
                col_letter = get_column_letter(col[0].column)
                worksheet.column_dimensions[col_letter].width = min(max(max_len + 5, 22), 65)

            # Embed Premium Excel Data Validation Dropdowns in template as well
            from openpyxl.worksheet.datavalidation import DataValidation

            # 1. Status Dropdown (Column H)
            status_dv = DataValidation(type="list", formula1='"Completed,Rescheduled,No Show,Yet to approach,In process"', allow_blank=True)
            worksheet.add_data_validation(status_dv)
            status_dv.add("H2:H500")

            # 2. Outcome Dropdown (Column I)
            outcome_dv = DataValidation(type="list", formula1='"Qualified,Not Qualified,Follow-up"', allow_blank=True)
            worksheet.add_data_validation(outcome_dv)
            outcome_dv.add("I2:I500")

            # 3. Demo Call Dropdown (Column K)
            demo_dv = DataValidation(type="list", formula1='"YES,NO,N/A"', allow_blank=True)
            worksheet.add_data_validation(demo_dv)
            demo_dv.add("K2:K500")

            # 4. Proposal Sent Dropdown (Column L)
            proposal_dv = DataValidation(type="list", formula1='"YES,NO,N/A"', allow_blank=True)
            worksheet.add_data_validation(proposal_dv)
            proposal_dv.add("L2:L500")

            # 5. Closures Dropdown (Column M)
            closures_dv = DataValidation(type="list", formula1='"YES,NO,N/A"', allow_blank=True)
            worksheet.add_data_validation(closures_dv)
            closures_dv.add("M2:M500")

            # Add a second sheet with persistence instructions and generic template guidance.
            notes_df = pd.DataFrame({
                'Key': [
                    'Template Version',
                    'Daily Update Guidance',
                    'Sample Values',
                    'Import Note'
                ],
                'Value': [
                    'Daily Import Template',
                    'Use this sheet to preserve daily updates and custom lead fields in CRM.',
                    'Values shown are examples only. Replace them with your actual lead data.',
                    'Keep the first sheet headers intact for import. Do not rename or remove columns.'
                ]
            })
            notes_df.to_excel(writer, index=False, sheet_name='Template Notes')
            notes_sheet = writer.sheets['Template Notes']
            for col in notes_sheet.columns:
                max_len = 0
                for cell in col:
                    val = str(cell.value or '')
                    if len(val) > max_len:
                        max_len = len(val)
                col_letter = get_column_letter(col[0].column)
                notes_sheet.column_dimensions[col_letter].width = min(max(max_len + 5, 18), 65)

        
        output.seek(0)
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=leads_template.xlsx'
        return response


class ImportJobViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ImportJobSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ["ADMIN", "MANAGER"]:
            return ImportJob.objects.all().select_related("uploaded_by").order_by("-created_at")
        return ImportJob.objects.filter(uploaded_by=user).select_related("uploaded_by").order_by("-created_at")


class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    queryset = Contact.objects.all().select_related("lead", "owner")

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return self.queryset
        if user.role == "MANAGER":
            team_member_ids = User.objects.filter(sales_teams__manager=user).values_list("id", flat=True)
            return self.queryset.filter(Q(owner=user) | Q(owner__id__in=team_member_ids))
        return self.queryset.filter(owner=user)

    def perform_create(self, serializer):
        owner = serializer.validated_data.get('owner', self.request.user)
        serializer.save(owner=owner)


class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealSerializer
    queryset = Deal.objects.all().select_related("owner", "lead")
    filterset_fields = ["stage", "owner"]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.filter(is_deleted=False)
        if user.role == "ADMIN":
            return qs
        if user.role == "MANAGER":
            team_member_ids = User.objects.filter(sales_teams__manager=user).values_list("id", flat=True)
            return qs.filter(Q(owner=user) | Q(owner__id__in=team_member_ids))
        return qs.filter(owner=user)

    def perform_create(self, serializer):
        owner = serializer.validated_data.get('owner', self.request.user)
        serializer.save(owner=owner)
        
    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save()


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    queryset = Activity.objects.all().select_related("user", "lead", "deal")

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return self.queryset
        if user.role == "MANAGER":
            team_member_ids = User.objects.filter(sales_teams__manager=user).values_list("id", flat=True)
            return self.queryset.filter(Q(user=user) | Q(user__id__in=team_member_ids))
        return self.queryset.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all().select_related("assigned_to", "lead", "deal")
    filterset_fields = ["is_completed", "priority", "assigned_to"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return self.queryset
        # Managers could potentially see their team's tasks, but keeping it simple for now
        return self.queryset.filter(assigned_to=user)

    def perform_create(self, serializer):
        # Allow assigning to others if admin/manager, otherwise default to self
        assigned_to = serializer.validated_data.get('assigned_to', self.request.user)
        if self.request.user.role == "SALES":
            assigned_to = self.request.user
            
        serializer.save(assigned_to=assigned_to)


# ----------------------------------------------------
# Dashboard ViewSets
# ----------------------------------------------------

class DashboardViewSet(viewsets.ViewSet):
    """
    Returns aggregated metrics based on the user's role.
    """

    @action(detail=False, methods=["get"], url_path='admin')
    def admin_summary(self, request):
        if request.user.role != "ADMIN":
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        return Response(admin_dashboard_data(request.user))

    @action(detail=False, methods=["get"], url_path='manager')
    def manager_summary(self, request):
        if request.user.role != "MANAGER":
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        return Response(manager_dashboard_data(request.user))

    @action(detail=False, methods=["get"], url_path='sales')
    def sales_summary(self, request):
        if request.user.role not in ["SALES", "MANAGER", "ADMIN"]:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        return Response(sales_dashboard_data(request.user))


# ----------------------------------------------------
# Panel Settings Views
# ----------------------------------------------------

class AdminPanelSettingView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminPanelSettingSerializer
    permission_classes = [IsAdminRole]

    def get_object(self):
        obj, created = AdminPanelSetting.objects.get_or_create(user=self.request.user)
        return obj

class ManagerPanelSettingView(generics.RetrieveUpdateAPIView):
    serializer_class = ManagerPanelSettingSerializer
    permission_classes = [IsManagerRole]

    def get_object(self):
        obj, created = ManagerPanelSetting.objects.get_or_create(user=self.request.user)
        return obj

class SalesPanelSettingView(generics.RetrieveUpdateAPIView):
    serializer_class = SalesPanelSettingSerializer
    
    def get_object(self):
        obj, created = SalesPanelSetting.objects.get_or_create(user=self.request.user)
        return obj


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    queryset = ActivityLog.objects.all().select_related("user")

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return self.queryset
        if user.role == "MANAGER":
            team_member_ids = User.objects.filter(sales_teams__manager=user).values_list("id", flat=True)
            return self.queryset.filter(Q(user=user) | Q(user__id__in=team_member_ids))
        return self.queryset.filter(user=user)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    queryset = Notification.objects.all()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        self.get_queryset().update(read=True)
        return Response({"success": True, "message": "All notifications marked as read."})


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    queryset = Document.objects.all().select_related("lead", "uploaded_by")
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return self.queryset
        if user.role == "MANAGER":
            team_member_ids = User.objects.filter(sales_teams__manager=user).values_list("id", flat=True)
            return self.queryset.filter(Q(lead__owner=user) | Q(lead__owner__id__in=team_member_ids) | Q(uploaded_by=user))
        return self.queryset.filter(Q(lead__owner=user) | Q(uploaded_by=user))

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class EveningReportViewSet(viewsets.ViewSet):
    """
    Evening Report (EOD) System ViewSet
    """
    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated
        return [IsAuthenticated()]

    def create_report(self, request):
        # POST /api/eod/create/
        user = request.user
        if user.role != "SALES":
            return Response({"error": "Only Sales Representatives can submit EOD reports."}, status=status.HTTP_403_FORBIDDEN)
        
        report_date = request.data.get("report_date", timezone.now().date())
        if EveningReport.objects.filter(employee=user, report_date=report_date).exists():
            return Response({"error": f"You have already submitted an EOD report for {report_date}."}, status=status.HTTP_400_BAD_REQUEST)
        
        manager = None
        try:
            manager = user.sales_profile.manager
        except:
            pass
            
        serializer = EveningReportSerializer(data=request.data)
        if serializer.is_valid():
            submission_status = "submitted"
            now = timezone.now()
            if str(report_date) == str(now.date()) and now.hour >= 19:
                submission_status = "late_submission"
                
            serializer.save(
                employee=user, 
                manager=manager, 
                submission_status=submission_status
            )
            
            create_activity_log(
                user=user,
                action=f"Submitted EOD Report for {report_date}",
                module="EOD Report",
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            if manager:
                create_notification(
                    user=manager,
                    message=f"New EOD Report submitted by {user.email} for {report_date}."
                )
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def my_reports(self, request):
        # GET /api/eod/my-reports/
        reports = EveningReport.objects.filter(employee=request.user)
        serializer = EveningReportSerializer(reports, many=True)
        return Response(serializer.data)

    def update_report(self, request, pk=None):
        # PUT /api/eod/update/{id}/
        user = request.user
        try:
            report = EveningReport.objects.get(id=pk, employee=user)
        except EveningReport.DoesNotExist:
            return Response({"error": "Report not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)
            
        if str(report.report_date) != str(timezone.now().date()):
            return Response({"error": "You can only edit same-day reports."}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = EveningReportSerializer(report, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def team_reports(self, request):
        # GET /api/eod/team-reports/
        user = request.user
        if user.role not in ["MANAGER", "ADMIN"]:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        if user.role == "ADMIN":
            reports = EveningReport.objects.all()
        else:
            reports = EveningReport.objects.filter(manager=user)
            
        serializer = EveningReportSerializer(reports, many=True)
        return Response(serializer.data)

    def approve_report(self, request, pk=None):
        # PUT /api/eod/approve/{id}/
        user = request.user
        if user.role not in ["MANAGER", "ADMIN"]:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            if user.role == "ADMIN":
                report = EveningReport.objects.get(id=pk)
            else:
                report = EveningReport.objects.get(id=pk, manager=user)
        except EveningReport.DoesNotExist:
            return Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)
            
        report.submission_status = "approved"
        report.approved_at = timezone.now()
        report.manager_remarks = request.data.get("manager_remarks", report.manager_remarks)
        report.save()
        
        create_activity_log(
            user=user,
            action=f"Approved EOD Report for {report.employee.email} on {report.report_date}",
            module="EOD Report",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        create_notification(
            user=report.employee,
            message=f"Your EOD Report for {report.report_date} has been approved."
        )
        
        return Response(EveningReportSerializer(report).data)

    def reject_report(self, request, pk=None):
        # PUT /api/eod/reject/{id}/
        user = request.user
        if user.role not in ["MANAGER", "ADMIN"]:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            if user.role == "ADMIN":
                report = EveningReport.objects.get(id=pk)
            else:
                report = EveningReport.objects.get(id=pk, manager=user)
        except EveningReport.DoesNotExist:
            return Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)
            
        report.submission_status = "rejected"
        report.manager_remarks = request.data.get("manager_remarks", report.manager_remarks)
        report.save()
        
        create_activity_log(
            user=user,
            action=f"Rejected EOD Report for {report.employee.email} on {report.report_date}",
            module="EOD Report",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        create_notification(
            user=report.employee,
            message=f"Your EOD Report for {report.report_date} has been rejected. Remarks: {report.manager_remarks}"
        )
        
        return Response(EveningReportSerializer(report).data)

    def all_reports(self, request):
        # GET /api/eod/all-reports/
        if request.user.role != "ADMIN":
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        reports = EveningReport.objects.all()
        serializer = EveningReportSerializer(reports, many=True)
        return Response(serializer.data)

    def analytics(self, request):
        # GET /api/eod/analytics/
        if request.user.role not in ["ADMIN", "MANAGER"]:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        reports = EveningReport.objects.all()
        if request.user.role == "MANAGER":
            reports = reports.filter(manager=request.user)
            
        total_calls = reports.aggregate(Sum("calls_done"))["calls_done__sum"] or 0
        total_emails = reports.aggregate(Sum("emails_sent"))["emails_sent__sum"] or 0
        total_meetings = reports.aggregate(Sum("meetings_attended"))["meetings_attended__sum"] or 0
        total_leads = reports.aggregate(Sum("leads_generated"))["leads_generated__sum"] or 0
        
        from django.db.models import Avg
        monthly_scores = reports.values("report_date").annotate(avg_score=Avg("productivity_score")).order_by("report_date")
        
        trend_data = []
        for ms in monthly_scores[:15]:
            trend_data.append({
                "date": str(ms["report_date"]),
                "score": round(ms["avg_score"], 1)
            })
            
        return Response({
            "totals": {
                "calls": total_calls,
                "emails": total_emails,
                "meetings": total_meetings,
                "leads": total_leads,
            },
            "productivityTrend": trend_data
        })

    def export_reports(self, request):
        # GET /api/eod/export/
        user = request.user
        if user.role not in ["ADMIN", "MANAGER"]:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        reports = EveningReport.objects.all()
        if user.role == "MANAGER":
            reports = reports.filter(manager=user)
            
        date_start = request.query_params.get("date_start")
        date_end = request.query_params.get("date_end")
        if date_start:
            reports = reports.filter(report_date__gte=date_start)
        if date_end:
            reports = reports.filter(report_date__lte=date_end)
            
        data = []
        for r in reports:
            data.append({
                "Employee": r.employee.email,
                "Report Date": str(r.report_date),
                "Calls": r.calls_done,
                "Emails": r.emails_sent,
                "Follow-ups": r.followups_done,
                "Meetings Fixed": r.meetings_fixed,
                "Meetings Attended": r.meetings_attended,
                "Leads Generated": r.leads_generated,
                "LinkedIn Outreach": r.linkedin_outreach,
                "Demos Given": r.demos_given,
                "Productivity Score": r.productivity_score,
                "Status": r.submission_status,
                "Key Highlights": r.key_highlights,
                "Manager Remarks": r.manager_remarks,
            })
            
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='EOD Reports')
        output.seek(0)
        
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=eod_reports_export.xlsx'
        return response

    def delete_report(self, request, pk=None):
        # DELETE /api/eod/delete/{id}/
        if request.user.role != "ADMIN":
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            report = EveningReport.objects.get(id=pk)
            report.delete()
            return Response({"success": True, "message": "Report deleted successfully."})
        except EveningReport.DoesNotExist:
            return Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)


class AICopilotViewSet(viewsets.ViewSet):
    """
    AI Features using Google Gemini / Mock heuristics as fallback
    """
    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], url_path="lead-summary")
    def lead_summary(self, request, pk=None):
        try:
            lead = Lead.objects.get(id=pk)
        except Lead.DoesNotExist:
            return Response({"error": "Lead not found."}, status=status.HTTP_404_NOT_FOUND)

        lead_name = lead.name
        company = lead.company or "N/A"
        industry = lead.industry or "N/A"
        location = lead.location or "N/A"
        email = lead.email or "N/A"
        phone = lead.phone or "N/A"
        designation = lead.designation or "N/A"
        status_value = lead.status or "New"
        score = lead.score
        lead_value = float(lead.value or 0)

        interest_level = "High" if score >= 60 else "Medium" if score >= 30 else "Low"
        
        # Build detailed summary based on available data
        summary_parts = [
            f"Lead {lead_name} from {company} operates in the {industry} sector"
        ]
        
        if location != "N/A":
            summary_parts.append(f"based in {location}")
        
        if designation != "N/A":
            summary_parts.append(f"holding the position of {designation}")
        
        summary_parts.append(
            f"Based on our comprehensive data analysis, this lead has an established conversion potential score of {score}/100 with an overall {interest_level} interest level"
        )
        
        # Add contact quality info
        contact_quality = []
        if email != "N/A":
            contact_quality.append("email verified")
        if phone != "N/A":
            contact_quality.append("phone available")
        if lead.linkedin_url:
            contact_quality.append("LinkedIn connected")
            
        if contact_quality:
            summary_parts.append(f"Contact quality: {', '.join(contact_quality)}")
        
        # Status-based recommendation
        if status_value in ["Proposal", "Negotiation"]:
            recommendation = "Follow up immediately with decision-makers to close the deal"
        elif status_value in ["Meeting", "Requirements"]:
            recommendation = "Schedule a targeted requirements call focusing on high-value solution architectures"
        elif status_value == "Qualified":
            recommendation = "Prepare customized proposal and schedule presentation"
        elif status_value == "Follow-up":
            recommendation = "Engage with personalized outreach highlighting relevant case studies"
        else:
            recommendation = "Initiate first contact with value-proposition email"
        
        summary = ". ".join(summary_parts) + "."
        
        return Response({
            "leadId": lead.id,
            "leadName": lead_name,
            "company": company,
            "industry": industry,
            "location": location,
            "email": email,
            "phone": phone,
            "designation": designation,
            "currentStatus": status_value,
            "estimatedValue": f"₹{lead_value:,.2f}" if lead_value > 0 else "Not specified",
            "summary": summary,
            "interestLevel": interest_level,
            "conversionScore": score,
            "recommendedNextAction": recommendation,
            "contactCompleteness": len(contact_quality),
            "hasEmail": email != "N/A",
            "hasPhone": phone != "N/A",
            "hasLinkedIn": bool(lead.linkedin_url)
        })

    @action(detail=True, methods=["post"], url_path="sales-prediction")
    def sales_prediction(self, request, pk=None):
        try:
            lead = Lead.objects.get(id=pk)
        except Lead.DoesNotExist:
            return Response({"error": "Lead not found."}, status=status.HTTP_404_NOT_FOUND)

        score = lead.score
        lead_value = float(lead.value or 0)
        status_value = lead.status or "New"
        
        # Calculate probability based on score and status
        base_prob = int(score * 0.8 + 10)
        
        # Adjust probability based on current status
        status_boost = {
            "Won": 100,
            "Negotiation": 15,
            "Proposal": 10,
            "Meeting": 5,
            "Requirements": 5,
            "Qualified": 3,
            "Follow-up": 0,
            "New": -5,
            "Lost": 0
        }.get(status_value, 0)
        
        prob = min(max(base_prob + status_boost, 5), 95)
        
        expected_revenue = lead_value * (prob / 100.0)

        from datetime import timedelta
        # More realistic close date based on current status
        days_map = {
            "Negotiation": 14,
            "Proposal": 30,
            "Meeting": 45,
            "Requirements": 60,
            "Qualified": 75,
            "Follow-up": 90,
            "New": 120,
        }
        closing_days = days_map.get(status_value, 90) - int(score * 0.3)
        closing_days = max(7, closing_days)  # Minimum 7 days
        closing_date = (timezone.now() + timedelta(days=closing_days)).strftime("%Y-%m-%d")

        # Confidence based on data completeness
        confidence = "High" if score >= 50 and lead.email and lead.phone else "Medium" if score >= 30 else "Low"
        
        # Calculate success factors
        success_factors = []
        if lead.email:
            success_factors.append("Email available")
        if lead.phone:
            success_factors.append("Phone contact confirmed")
        if lead.linkedin_url:
            success_factors.append("LinkedIn connection")
        if score >= 60:
            success_factors.append("High engagement score")
        if lead_value > 0:
            success_factors.append(f"Deal value: ₹{lead_value:,.0f}")
        
        return Response({
            "leadId": lead.id,
            "leadName": lead.name,
            "company": lead.company or "N/A",
            "currentStatus": status_value,
            "leadScore": score,
            "dealValue": f"₹{lead_value:,.2f}" if lead_value > 0 else "₹0.00",
            "closingProbability": f"{prob}%",
            "expectedRevenue": f"₹{expected_revenue:,.2f}",
            "predictedCloseDate": closing_date,
            "daysToClose": closing_days,
            "confidenceInterval": confidence,
            "successFactors": success_factors,
            "riskFactors": [] if score >= 50 else ["Low engagement", "Needs follow-up"]
        })

    @action(detail=False, methods=["post"], url_path="chat")
    def chat_assistant(self, request):
        from django.db.models import Sum, Count, Q
        from django.utils import timezone
        from datetime import datetime, timedelta
        from sales.models import Lead, Task, Deal, Activity, EveningReport, Team
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        user = request.user
        role = (user.role or "SALES").upper()
        user_message = request.data.get("message", "").strip()
        user_message_lower = user_message.lower()

        # Role-based Authorization filters
        team_members = []
        managed_team = None
        if role == "MANAGER":
            managed_team = Team.objects.filter(manager=user).first()
            if managed_team:
                team_members = list(managed_team.members.all())
            else:
                team_members = [user]

        # ----------------------------------------------------
        # 1. CATEGORY: REVENUE / CONVERSION / ANALYTICS
        # ----------------------------------------------------
        if any(w in user_message_lower for w in ["revenue", "conversion", "deals", "performance", "forecast", "insight"]):
            if role == "ADMIN":
                total_leads = Lead.objects.filter(is_deleted=False).count()
                won_leads = Lead.objects.filter(is_deleted=False, status="Won")
                won_count = won_leads.count()
                total_rev = won_leads.aggregate(total=Sum("value"))["total"] or 0.0
                conversion = (won_count / total_leads * 100) if total_leads > 0 else 0.0
                
                # Active sales pipeline values
                pipeline_leads = Lead.objects.filter(is_deleted=False).exclude(status__in=["Won", "Lost"])
                pipeline_value = pipeline_leads.aggregate(total=Sum("value"))["total"] or 0.0
                
                reply = (
                    f"### 📊 TDTL Enterprise Revenue Analytics (Admin View)\n"
                    f"* **Total Company Revenue**: ₹{total_rev:,.2f} *(from {won_count} closed deals)*\n"
                    f"* **Active Sales Pipeline**: ₹{pipeline_value:,.2f} *(across {pipeline_leads.count()} active accounts)*\n"
                    f"* **Lead Conversion Ratio**: **{conversion:.1f}%** *(Total Leads: {total_leads})*\n\n"
                    f"#### 🏆 Top Sales Representatives:\n"
                    f"The top performers ranked by high-value closures:\n"
                )
                
                top_reps = Lead.objects.filter(is_deleted=False, status="Won")\
                    .values("owner__email", "owner__first_name", "owner__last_name")\
                    .annotate(total_val=Sum("value"), closures=Count("id"))\
                    .order_by("-total_val")[:3]
                
                for idx, rep in enumerate(top_reps, 1):
                    name = f"{rep['owner__first_name']} {rep['owner__last_name']}".strip() or rep['owner__email']
                    reply += f"{idx}. **{name}** — ₹{rep['total_val']:,.2f} ({rep['closures']} deals closed)\n"
                
                reply += "\n*AI Insight: Our Q2 momentum looks strong. Focus on expanding lead acquisition channels to accelerate conversions by another 4%.*"

            elif role == "MANAGER":
                team_name = managed_team.name if managed_team else "Your Team"
                total_leads = Lead.objects.filter(is_deleted=False, owner__in=team_members).count()
                won_leads = Lead.objects.filter(is_deleted=False, status="Won", owner__in=team_members)
                won_count = won_leads.count()
                team_rev = won_leads.aggregate(total=Sum("value"))["total"] or 0.0
                conversion = (won_count / total_leads * 100) if total_leads > 0 else 0.0
                
                reply = (
                    f"### 🛡️ Team Revenue Analytics — *{team_name}*\n"
                    f"* **Team Closures Total**: ₹{team_rev:,.2f} *(Deals: {won_count})*\n"
                    f"* **Active Leads Monitored**: {total_leads} accounts\n"
                    f"* **Conversion Efficiency**: **{conversion:.1f}%**\n\n"
                    f"#### 📈 Representative Performance Breakdowns:\n"
                )
                
                team_stats = Lead.objects.filter(is_deleted=False, owner__in=team_members)\
                    .values("owner__email", "owner__first_name", "owner__last_name")\
                    .annotate(total_val=Sum("value"), leads_cnt=Count("id"))\
                    .order_by("-total_val")
                
                for rep in team_stats:
                    name = f"{rep['owner__first_name']} {rep['owner__last_name']}".strip() or rep['owner__email']
                    reply += f"- **{name}**: {rep['leads_cnt']} leads managed (Pipeline value equivalent)\n"

            else:
                # SALES representative view
                own_leads = Lead.objects.filter(is_deleted=False, owner=user)
                total_cnt = own_leads.count()
                won_cnt = own_leads.filter(status="Won").count()
                own_rev = own_leads.filter(status="Won").aggregate(total=Sum("value"))["total"] or 0.0
                conversion = (won_cnt / total_cnt * 100) if total_cnt > 0 else 0.0
                
                reply = (
                    f"### 👤 Your Sales Performance summary\n"
                    f"* **Your Revenue Closed**: ₹{own_rev:,.2f}\n"
                    f"* **Your Won Deals**: {won_cnt} deals\n"
                    f"* **Personal Conversion Score**: **{conversion:.1f}%** *(Total assigned leads: {total_cnt})*\n\n"
                    f"Excellent work, Representative. Reach out to qualified pipeline leads to bump up your weekly numbers!"
                )

        # ----------------------------------------------------
        # 2. CATEGORY: ACTIVE USERS / EOD REPORTS / ACTIVITY TODAY
        # ----------------------------------------------------
        elif any(w in user_message_lower for w in ["eod", "evening report", "active user", "active sales", "active reps", "inactive", "submission", "submitted"]):
            today_date = timezone.now().date()
            if role == "ADMIN":
                eod_submitted = EveningReport.objects.filter(report_date=today_date)
                submitted_emails = [r.employee.email for r in eod_submitted]
                all_sales = User.objects.filter(role="SALES")
                inactive_sales = [u.email for u in all_sales if u.email not in submitted_emails]
                
                reply = (
                    f"### 🕒 Daily Enterprise EOD & Activity Logs\n"
                    f"* **Total EOD Reports Submitted Today**: {eod_submitted.count()}\n"
                    f"* **Active Representatives Today**: {len(submitted_emails)}\n\n"
                    f"#### 📝 Submitted EODs:\n"
                )
                for r in eod_submitted:
                    emp_name = r.employee.get_full_name() or r.employee.email
                    reply += f"- **{emp_name}**: {r.calls_done} calls, {r.meetings_attended} meetings, {r.linkedin_outreach} outreach. *(Status: {r.submission_status})*\n"
                
                if inactive_sales:
                    reply += f"\n⚠️ **Pending EOD Submissions** ({len(inactive_sales)} users):\n"
                    for email in inactive_sales:
                        reply += f"- {email}\n"

            elif role == "MANAGER":
                eod_submitted = EveningReport.objects.filter(report_date=today_date, employee__in=team_members)
                submitted_emails = [r.employee.email for r in eod_submitted]
                inactive_members = [u.email for u in team_members if u.email not in submitted_emails]
                
                reply = (
                    f"### 📋 Team Activity & EOD Submissions today\n"
                    f"* **Team EOD Reports Submitted**: {eod_submitted.count()} / {len(team_members)}\n\n"
                )
                if eod_submitted.exists():
                    reply += "#### 🌟 Completed Submissions:\n"
                    for r in eod_submitted:
                        emp_name = r.employee.get_full_name() or r.employee.email
                        reply += f"- **{emp_name}**: {r.calls_done} calls done, {r.demos_given} demo pitches. *(Score: {r.productivity_score}/100)*\n"
                
                if inactive_members:
                    reply += "\n⏳ **Awaiting Submissions from**:\n"
                    for m in inactive_members:
                        reply += f"- {m}\n"

            else:
                # SALES representative view
                my_report = EveningReport.objects.filter(report_date=today_date, employee=user).first()
                if my_report:
                    reply = (
                        f"### ✅ Your EOD Report is Submitted!\n"
                        f"* **Report Date**: {my_report.report_date}\n"
                        f"* **Calls completed**: {my_report.calls_done}\n"
                        f"* **Meetings Attended**: {my_report.meetings_attended}\n"
                        f"* **Productivity Index**: **{my_report.productivity_score}/100**\n\n"
                        f"Status: **{my_report.get_submission_status_display()}**"
                    )
                else:
                    reply = (
                        f"### ⏳ Your EOD Report is Pending!\n"
                        f"You have not submitted an Evening Report for today ({today_date}) yet.\n\n"
                        f"Use the **My EOD Reports** page to submit your daily activities instantly to your Manager!"
                    )

        # ----------------------------------------------------
        # 3. CATEGORY: LEADS / HIGH PRIORITY / CONVERTED
        # ----------------------------------------------------
        elif any(w in user_message_lower for w in ["lead", "leads", "priority"]):
            if role == "ADMIN":
                active_leads = Lead.objects.filter(is_deleted=False).exclude(status__in=["Won", "Lost"])
                high_score_leads = active_leads.filter(score__gte=50)
                
                reply = (
                    f"### 🎯 Company-Wide Leads & Pipelines\n"
                    f"* **Total Ongoing Leads**: {active_leads.count()}\n"
                    f"* **High-Priority Leads (Score >= 50)**: {high_score_leads.count()}\n\n"
                    f"#### 🔥 Key Opportunities:\n"
                )
                for l in high_score_leads[:5]:
                    owner_name = l.owner.name if l.owner else "Unassigned"
                    reply += f"- **{l.name}** ({l.company}) — Value: ₹{l.value:,.2f} | Score: {l.score}/100 | Owner: {owner_name}\n"

            elif role == "MANAGER":
                active_leads = Lead.objects.filter(is_deleted=False, owner__in=team_members).exclude(status__in=["Won", "Lost"])
                high_score_leads = active_leads.filter(score__gte=50)
                
                reply = (
                    f"### 🎯 Team Leads Summary\n"
                    f"* **Team Active Leads**: {active_leads.count()}\n"
                    f"* **High-Score Leads (Score >= 50)**: {high_score_leads.count()}\n\n"
                    f"#### 🔍 Highly Convertible Opportunities:\n"
                )
                for l in high_score_leads:
                    reply += f"- **{l.name}** ({l.company}) — Value: ₹{l.value:,.2f} | Stage: {l.status} | Assigned to: {l.owner.name if l.owner else 'Unassigned'}\n"

            else:
                # SALES representative view
                active_leads = Lead.objects.filter(is_deleted=False, owner=user).exclude(status__in=["Won", "Lost"])
                high_score_leads = active_leads.filter(score__gte=50)
                
                reply = (
                    f"### 🎯 Your Leads Portfolio\n"
                    f"* **Your Active Leads**: {active_leads.count()}\n"
                    f"* **Your Hot Leads (Score >= 50)**: {high_score_leads.count()}\n\n"
                )
                if active_leads.exists():
                    reply += "#### 📋 Your Ongoing Opportunities:\n"
                    for l in active_leads[:5]:
                        reply += f"- **{l.name}** ({l.company}) — Value: ₹{l.value:,.2f} | Stage: {l.status} | Priority Score: {l.score}/100\n"
                else:
                    reply += "You currently have no active leads assigned. Contact your manager to retrieve fresh allocations!"

        # ----------------------------------------------------
        # 4. CATEGORY: TASKS / WORKLOAD / OVERDUE
        # ----------------------------------------------------
        elif any(w in user_message_lower for w in ["task", "tasks", "workload", "overdue"]):
            now = timezone.now()
            if role == "ADMIN":
                pending_tasks = Task.objects.filter(is_completed=False)
                overdue = pending_tasks.filter(due_date__lt=now)
                
                reply = (
                    f"### ✏️ Company-Wide Tasks and Workloads\n"
                    f"* **Total Pending Tasks**: {pending_tasks.count()}\n"
                    f"* **Overdue Tasks**: {overdue.count()}\n\n"
                    f"#### 📊 Employee Workload Distribution (Top 3 Pending):\n"
                )
                workloads = Task.objects.filter(is_completed=False)\
                    .values("assigned_to__email", "assigned_to__first_name", "assigned_to__last_name")\
                    .annotate(task_count=Count("id"))\
                    .order_by("-task_count")[:3]
                
                for w in workloads:
                    name = f"{w['assigned_to__first_name']} {w['assigned_to__last_name']}".strip() or w['assigned_to__email']
                    reply += f"- **{name}**: {w['task_count']} pending tasks\n"

            elif role == "MANAGER":
                pending_tasks = Task.objects.filter(is_completed=False, assigned_to__in=team_members)
                overdue = pending_tasks.filter(due_date__lt=now)
                
                reply = (
                    f"### ✏️ Team Workloads Summary\n"
                    f"* **Team Pending Tasks**: {pending_tasks.count()}\n"
                    f"* **Team Overdue Tasks**: {overdue.count()}\n\n"
                    f"#### 📋 Representative Pending Tasks:\n"
                )
                for t in pending_tasks[:6]:
                    reply += f"- **{t.title}** (Assigned: {t.assigned_to.name}) — Due: {t.due_date.strftime('%Y-%m-%d')} | Priority: {t.priority}\n"

            else:
                # SALES representative view
                pending_tasks = Task.objects.filter(is_completed=False, assigned_to=user)
                overdue = pending_tasks.filter(due_date__lt=now)
                
                reply = (
                    f"### ✏️ Your Personal Tasks\n"
                    f"* **Your Pending Tasks**: {pending_tasks.count()}\n"
                    f"* **Your Overdue Tasks**: {overdue.count()}\n\n"
                )
                if pending_tasks.exists():
                    reply += "#### 📝 Tasks Requiring Action:\n"
                    for t in pending_tasks:
                        time_left = "OVERDUE" if t.due_date < now else f"Due by {t.due_date.strftime('%b %d')}"
                        reply += f"- **{t.title}** — *{time_left}* | Priority: {t.priority.upper()}\n"
                else:
                    reply += "✨ *Zero pending tasks! You are completely up to date!*"

        # ----------------------------------------------------
        # 5. CATEGORY: EMAIL DRAFTER / FOLLOW-UP HELPERS
        # ----------------------------------------------------
        elif any(w in user_message_lower for w in ["email", "mail", "generate", "draft"]):
            # Generate a rapid Outreach Draft
            reply = (
                f"### ✉️ AI Outbound Outreach Drafter\n"
                f"Here is a customized outreach draft prepared for your active follow-ups:\n\n"
                f"```text\n"
                f"Subject: Accelerating business integrations with TDTL Solutions\n\n"
                f"Hi Client,\n\n"
                f"I hope you're having a productive week! I am reaching out to follow up on our discussion regarding TDTL Enterprise Solutions.\n\n"
                f"We would love to schedule a quick 10-minute briefing session to explore how our customizable platform can solve your core operational bottlenecks.\n\n"
                f"Let me know if tomorrow at 3 PM works for your calendar.\n\n"
                f"Best regards,\n"
                f"{user.get_full_name() or user.email}\nTDTL Sales Team\n"
                f"```"
            )

        # ----------------------------------------------------
        # 6. DEFAULT FALLBACK / HELP PROMPTS
        # ----------------------------------------------------
        else:
            if role == "ADMIN":
                reply = (
                    f"### 🧠 TDTL Administrative Copilot Core\n"
                    f"Welcome, Administrator. I can fetch live analytics, workload metrics, and EOD reports. Ask me questions like:\n"
                    f"* 📈 *\"Show total company revenue\"*\n"
                    f"* 🕒 *\"Who has submitted their EOD reports today?\"*\n"
                    f"* 🎯 *\"Show the company-wide leads priority\"*\n"
                    f"* ✏️ *\"Which representative has the highest workload?\"*"
                )
            elif role == "MANAGER":
                reply = (
                    f"### 🧠 TDTL Managerial Copilot Core\n"
                    f"Welcome, Manager. I monitor your team's live pipelines, tasks, and EOD reports. Ask me questions like:\n"
                    f"* 📈 *\"Show team revenue performance\"*\n"
                    f"* 🕒 *\"Who submitted EOD reports today?\"*\n"
                    f"* 🎯 *\"Show high score team leads\"*\n"
                    f"* ✏️ *\"Show team pending tasks\"*"
                )
            else:
                reply = (
                    f"### 🧠 TDTL Sales Assistant Copilot\n"
                    f"Hi {user.first_name or 'there'}! I am here to help you manage your personal daily metrics, tasks, and follow-ups. Ask me questions like:\n"
                    f"* ✏️ *\"What are my pending tasks for today?\"*\n"
                    f"* 🎯 *\"Show my active leads\"*\n"
                    f"* 🕒 *\"What is my EOD report status?\"*\n"
                    f"* ✉️ *\"Generate follow-up email\"*"
                )

        return Response({
            "reply": reply,
            "timestamp": timezone.now()
        })

    @action(detail=False, methods=["post"], url_path="email-generator")
    def email_generator(self, request):
        lead_id = request.data.get("leadId")
        template_type = request.data.get("templateType", "follow_up")
        
        lead_name = "Client"
        company_name = "their company"
        
        if lead_id:
            try:
                lead = Lead.objects.get(id=lead_id)
                lead_name = lead.name
                company_name = lead.company or company_name
            except Lead.DoesNotExist:
                pass

        if template_type == "proposal":
            subject = f"Business Proposal - TDTL Enterprise Solutions"
            body = (
                f"Dear {lead_name},\n\n"
                f"Following our productive discussion regarding {company_name}'s requirements, we are pleased to submit our comprehensive business proposal for your review.\n\n"
                f"Our solution is tailored to streamline your operations, optimize revenue models, and scale your workflows. We look forward to your thoughts and next steps.\n\n"
                f"Warm regards,\n{request.user.get_full_name() or request.user.email}\nTDTL CRM Team"
            )
        elif template_type == "response":
            subject = f"Re: Your inquiry with TDTL Solutions"
            body = (
                f"Dear {lead_name},\n\n"
                f"Thank you for reaching out to us. We have received your inquiry regarding our services and are currently analyzing your operational specs to align our best offerings.\n\n"
                f"One of our executives will get in touch with you shortly. Please let us know if there is a preferred time for a quick 10-minute briefing.\n\n"
                f"Best regards,\n{request.user.get_full_name() or request.user.email}\nTDTL CRM Team"
            )
        else:
            subject = f"Following up on our conversation - TDTL"
            body = (
                f"Hi {lead_name},\n\n"
                f"I hope you're having a productive week! I'm following up on our recent meeting regarding {company_name}'s upgrade plans.\n\n"
                f"I would love to sync briefly to see if you have any questions about the solutions we outlined, or if you'd like to schedule a deep-dive session next week.\n\n"
                f"Best,\n{request.user.get_full_name() or request.user.email}\nTDTL CRM"
            )

        return Response({
            "subject": subject,
            "body": body
        })


class ReportsViewSet(viewsets.ViewSet):
    """
    Enterprise Custom Reporting Views
    Provides revenue, activity, and performance reports for admin, manager, and sales roles.
    """
    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated
        return [IsAuthenticated()]

    @action(detail=False, methods=["get"])
    def generate(self, request):
        """Generate report by type: revenue, activity, summary"""
        try:
            report_type = request.query_params.get("type", "revenue")
            
            # Validate report type
            valid_types = ["revenue", "activity", "summary"]
            if report_type not in valid_types:
                return Response(
                    {"error": f"Invalid report type. Must be one of: {', '.join(valid_types)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = generate_sales_report(request.user, report_type=report_type)
            
            # Log report generation
            create_activity_log(
                user=request.user,
                action=f"Generated {report_type} report",
                module="Reports",
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response(data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Report generation error: {str(e)}")
            return Response(
                {"error": "Failed to generate report"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["get"])
    def list_available(self, request):
        """List all available report types and their descriptions"""
        report_types = {
            "revenue": "Revenue & Pipeline Performance Report",
            "activity": "Sales Rep Performance Report",
            "summary": "Summary Report"
        }
        return Response(report_types)
