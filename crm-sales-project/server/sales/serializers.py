from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Team, Lead, Contact, Deal, Activity, ImportJob, Task,
    AdminPanelSetting, ManagerPanelSetting, SalesPanelSetting,
    Document, ActivityLog, Notification, EveningReport
)
User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.ReadOnlyField(source="get_full_name")
    class Meta:
        model = User
        fields = ("id", "email", "name", "role")

class TeamSerializer(serializers.ModelSerializer):
    manager_name = serializers.ReadOnlyField(source="manager.get_full_name")
    members_detail = UserSerializer(source="members", many=True, read_only=True)

    class Meta:
        model = Team
        fields = ("id", "name", "manager", "manager_name", "members", "members_detail")


class ContactSerializer(serializers.ModelSerializer):
    assignedTo = serializers.PrimaryKeyRelatedField(
        source="owner", 
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Contact
        fields = (
            "id", "name", "company", "email", "phone", 
            "industry", "size", "website", "last_contacted", 
            "assignedTo", "created_at", "designation", "location", "linkedin_url", "custom_fields"
        )


class ActivitySerializer(serializers.ModelSerializer):
    assignedTo = serializers.ReadOnlyField(source="user.id")
    date = serializers.DateTimeField(source="timestamp", read_only=True)
    type = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = ("id", "type", "content", "assignedTo", "date", "lead", "deal")

    def get_type(self, obj):
        return obj.type.lower()


class TaskSerializer(serializers.ModelSerializer):
    assignedTo = serializers.PrimaryKeyRelatedField(
        source="assigned_to", 
        queryset=User.objects.all(),
        required=False
    )
    startDate = serializers.DateTimeField(source="start_date", required=False, allow_null=True)
    dueDate = serializers.DateTimeField(source="due_date")
    estimatedHours = serializers.DecimalField(source="estimated_hours", max_digits=5, decimal_places=2, required=False, default=0.0)
    completed = serializers.BooleanField(source="is_completed", required=False, default=False)
    progressPercentage = serializers.IntegerField(source="progress_percentage", required=False, default=0)

    class Meta:
        model = Task
        fields = ("id", "title", "description", "startDate", "dueDate", "estimatedHours", "completed", "priority", "assignedTo", "status", "progressPercentage")


class DealSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source="owner.email")

    class Meta:
        model = Deal
        fields = "__all__"


class LeadSerializer(serializers.ModelSerializer):
    assignedTo = serializers.PrimaryKeyRelatedField(
        source="owner", 
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    date = serializers.DateTimeField(source="created_at", read_only=True)
    
    class Meta:
        model = Lead
        fields = (
            "id", "name", "company", "email", "phone", 
            "status", "value", "date", "assignedTo", "source",
            "designation", "location", "linkedin_url", "custom_fields", "score",
            "imported_at", "imported_by"
        )
        read_only_fields = ("date", "score", "imported_at", "imported_by")


class ImportJobSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(source="uploaded_by.email", read_only=True)
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True)

    class Meta:
        model = ImportJob
        fields = "__all__"
        read_only_fields = ("uploaded_by", "status", "summary", "created_at")


class AdminPanelSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminPanelSetting
        fields = "__all__"
        read_only_fields = ("user",)


class ManagerPanelSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagerPanelSetting
        fields = "__all__"
        read_only_fields = ("user",)


class SalesPanelSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesPanelSetting
        fields = "__all__"
        read_only_fields = ("user",)


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.ReadOnlyField(source="uploaded_by.email")
    fileName = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ("id", "lead", "uploaded_by", "uploaded_by_email", "file", "uploaded_at", "fileName")
        read_only_fields = ("uploaded_by",)

    def get_fileName(self, obj):
        if obj.file:
            import os
            return os.path.basename(obj.file.name)
        return ""


class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source="user.email")

    class Meta:
        model = ActivityLog
        fields = ("id", "user", "user_email", "action", "module", "ip_address", "timestamp")


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "user", "message", "read", "created_at")


class EveningReportSerializer(serializers.ModelSerializer):
    employee_email = serializers.ReadOnlyField(source="employee.email")
    employee_name = serializers.SerializerMethodField()
    manager_email = serializers.ReadOnlyField(source="manager.email")

    class Meta:
        model = EveningReport
        fields = "__all__"
        read_only_fields = ("employee", "productivity_score", "submitted_at", "approved_at")

    def get_employee_name(self, obj):
        try:
            profile = obj.employee.sales_profile
            return f"{profile.first_name} {profile.last_name}".strip() or obj.employee.email
        except:
            return obj.employee.email
