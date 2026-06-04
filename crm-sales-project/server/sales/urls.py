from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeadViewSet, ContactViewSet, DealViewSet, 
    ActivityViewSet, ImportJobViewSet, DashboardViewSet, TaskViewSet,
    AdminPanelSettingView, ManagerPanelSettingView, SalesPanelSettingView,
    TeamViewSet, ActivityLogViewSet, NotificationViewSet, DocumentViewSet,
    EveningReportViewSet, AICopilotViewSet, ReportsViewSet
)

router = DefaultRouter()
router.register(r"teams", TeamViewSet, basename="team")
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"contacts", ContactViewSet, basename="contact")
router.register(r"deals", DealViewSet, basename="deal")
router.register(r"activities", ActivityViewSet, basename="activity")
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"imports", ImportJobViewSet, basename="import")
router.register(r"activity-logs", ActivityLogViewSet, basename="activity-log")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"documents", DocumentViewSet, basename="document")
router.register(r"ai", AICopilotViewSet, basename="ai")
router.register(r"reports", ReportsViewSet, basename="report")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/admin/", DashboardViewSet.as_view({"get": "admin_summary"}), name="admin_dashboard"),
    path("dashboard/manager/", DashboardViewSet.as_view({"get": "manager_summary"}), name="manager_dashboard"),
    path("dashboard/sales/", DashboardViewSet.as_view({"get": "sales_summary"}), name="sales_dashboard"),
    path("panel-settings/admin/", AdminPanelSettingView.as_view(), name="admin_panel_settings"),
    path("panel-settings/manager/", ManagerPanelSettingView.as_view(), name="manager_panel_settings"),
    path("panel-settings/sales/", SalesPanelSettingView.as_view(), name="sales_panel_settings"),
    
    # EOD / Evening Report Endpoints (Exactly as requested)
    path("eod/create/", EveningReportViewSet.as_view({"post": "create_report"}), name="eod_create"),
    path("eod/my-reports/", EveningReportViewSet.as_view({"get": "my_reports"}), name="eod_my_reports"),
    path("eod/update/<int:pk>/", EveningReportViewSet.as_view({"put": "update_report"}), name="eod_update"),
    path("eod/team-reports/", EveningReportViewSet.as_view({"get": "team_reports"}), name="eod_team_reports"),
    path("eod/approve/<int:pk>/", EveningReportViewSet.as_view({"put": "approve_report"}), name="eod_approve"),
    path("eod/reject/<int:pk>/", EveningReportViewSet.as_view({"put": "reject_report"}), name="eod_reject"),
    path("eod/all-reports/", EveningReportViewSet.as_view({"get": "all_reports"}), name="eod_all_reports"),
    path("eod/analytics/", EveningReportViewSet.as_view({"get": "analytics"}), name="eod_analytics"),
    path("eod/export/", EveningReportViewSet.as_view({"get": "export_reports"}), name="eod_export"),
    path("eod/delete/<int:pk>/", EveningReportViewSet.as_view({"delete": "delete_report"}), name="eod_delete"),
]
