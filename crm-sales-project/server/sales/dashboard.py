from datetime import date
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from django.db.models.functions import ExtractMonth, ExtractYear
from django.utils import timezone

from .models import Lead, Task

User = get_user_model()

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def format_currency(value):
    return f"₹{value:,.0f}" if value is not None else "₹0"


def _month_year_pairs(last_n_months=6):
    today = date.today()
    pairs = []
    year = today.year
    month = today.month
    for offset in range(last_n_months - 1, -1, -1):
        m = month - offset
        y = year
        while m <= 0:
            m += 12
            y -= 1
        pairs.append((y, m))
    return pairs


def _build_monthly_series(monthly_values, span=4):
    pairs = _month_year_pairs(span)
    month_map = {(item["year"], item["month"]): item["total"] for item in monthly_values}
    return [
        {
            "name": MONTH_NAMES[month - 1],
            "revenue": float(month_map.get((year, month), 0) or 0),
        }
        for year, month in pairs
    ]


def _percentage_change(current, previous):
    if previous and previous != 0:
        return round((current - previous) / previous * 100, 1)
    return None


def admin_dashboard_data(user):
    total_revenue = Lead.objects.filter(status=Lead.StatusChoices.WON, is_deleted=False).aggregate(total=Sum("value"))["total"] or 0
    managers = User.objects.filter(role=User.Role.MANAGER)
    current_month = timezone.now().month
    previous_month = current_month - 1 or 12
    previous_month_year = timezone.now().year if current_month != 1 else timezone.now().year - 1

    manager_data = []
    for manager in managers:
        team_member_ids = list(User.objects.filter(sales_teams__manager=manager).values_list("id", flat=True))
        team_revenue = Lead.objects.filter(owner__id__in=team_member_ids, status=Lead.StatusChoices.WON, is_deleted=False).aggregate(total=Sum("value"))["total"] or 0
        previous_period_revenue = Lead.objects.filter(
            owner__id__in=team_member_ids,
            status=Lead.StatusChoices.WON,
            is_deleted=False,
            created_at__year=previous_month_year,
            created_at__month=previous_month
        ).aggregate(total=Sum("value"))["total"] or 0
        performance_change = _percentage_change(team_revenue, previous_period_revenue)
        profile = getattr(manager, "manager_profile", None)
        manager_data.append({
            "id": manager.id,
            "name": f"{getattr(profile, 'first_name', manager.first_name)} {getattr(profile, 'last_name', manager.last_name)}".strip() or manager.email,
            "region": getattr(profile, "region", "N/A") if profile else "N/A",
            "teamSize": len(team_member_ids),
            "revenue": format_currency(team_revenue),
            "performance": f"{performance_change}%" if performance_change is not None else "N/A"
        })

    return {
        "overview": {
            "totalManagers": managers.count(),
            "totalGlobalRevenue": format_currency(total_revenue),
            "totalSalesReps": User.objects.filter(role=User.Role.SALES).count(),
        },
        "managers": manager_data,
    }


def manager_dashboard_data(user):
    team_member_ids = list(User.objects.filter(sales_teams__manager=user).values_list("id", flat=True))
    team_leads = Lead.objects.filter(owner__id__in=team_member_ids, is_deleted=False)
    team_won_leads = team_leads.filter(status=Lead.StatusChoices.WON)
    total_team_revenue = team_won_leads.aggregate(total=Sum("value"))["total"] or 0
    total_team_leads = team_leads.count()
    total_task_count = Task.objects.filter(assigned_to__id__in=team_member_ids).count()
    completed_tasks = Task.objects.filter(assigned_to__id__in=team_member_ids, is_completed=True).count()
    task_completion_rate = (completed_tasks / total_task_count * 100) if total_task_count else 0

    team_performance = []
    for member in User.objects.filter(id__in=team_member_ids):
        member_leads = team_leads.filter(owner=member)
        member_rev = member_leads.filter(status=Lead.StatusChoices.WON).aggregate(total=Sum("value"))["total"] or 0
        member_pipeline = member_leads.exclude(status__in=[Lead.StatusChoices.WON, Lead.StatusChoices.LOST]).aggregate(total=Sum("value"))["total"] or 0
        total_count = member_leads.count()
        won_count = member_leads.filter(status=Lead.StatusChoices.WON).count()
        conv_rate = (won_count / total_count * 100) if total_count else 0
        profile = getattr(member, "sales_profile", None)
        team_performance.append({
            "id": member.id,
            "name": f"{getattr(profile, 'first_name', member.first_name)} {getattr(profile, 'last_name', member.last_name)}".strip() or member.email,
            "email": member.email,
            "phone": getattr(profile, "phone_number", "") if profile else "",
            "role": "Sales Representative",
            "dealsClosed": won_count,
            "totalLeads": total_count,
            "revenue": format_currency(member_rev),
            "activePipeline": format_currency(member_pipeline),
            "conversionRate": f"{conv_rate:.1f}%",
            "targetProgress": min(int(member_rev / 10000 * 100), 100) if member_rev else 0,
        })

    panel = getattr(user, "manager_panel", None)
    monthly_target = getattr(panel, "team_revenue_target", 50000) if panel else 50000
    team_attainment = round((total_team_revenue / monthly_target * 100), 1) if monthly_target else 0

    revenue_by_month = (
        team_won_leads
        .annotate(month=ExtractMonth("created_at"), year=ExtractYear("created_at"))
        .values("year", "month")
        .annotate(total=Sum("value"))
        .order_by("year", "month")
    )

    revenue_trend = _build_monthly_series(revenue_by_month, span=6)

    return {
        "teamTarget": format_currency(monthly_target),
        "teamAttainment": team_attainment,
        "activeReps": len(team_member_ids),
        "totalTeamLeads": total_team_leads,
        "totalTeamRevenue": format_currency(total_team_revenue),
        "taskCompletionRate": round(task_completion_rate, 1),
        "revenueData": revenue_trend,
        "teamPerformance": team_performance,
    }


def sales_dashboard_data(user):
    my_leads = Lead.objects.filter(owner=user, is_deleted=False)
    total_value = my_leads.aggregate(total=Sum("value"))["total"] or 0
    won_value = my_leads.filter(status=Lead.StatusChoices.WON).aggregate(total=Sum("value"))["total"] or 0
    won_count = my_leads.filter(status=Lead.StatusChoices.WON).count()
    total_count = my_leads.count()
    conversion_rate = (won_count / total_count * 100) if total_count else 0

    funnel_data = [
        {"name": status_choice[1], "value": my_leads.filter(status=status_choice[0]).count()}
        for status_choice in Lead.StatusChoices.choices
    ]

    revenue_by_month = (
        my_leads
        .filter(status=Lead.StatusChoices.WON)
        .annotate(month=ExtractMonth("created_at"), year=ExtractYear("created_at"))
        .values("year", "month")
        .annotate(total=Sum("value"))
        .order_by("year", "month")
    )

    revenue_data = _build_monthly_series(revenue_by_month, span=4)

    return {
        "kpiCards": [
            {"title": "Total Leads", "value": total_count, "icon": "Users", "trend": f"{conversion_rate:.1f}%"},
            {"title": "Active Pipeline", "value": format_currency(total_value), "icon": "TrendingUp", "trend": "Real-time"},
            {"title": "Closed Revenue", "value": format_currency(won_value), "icon": "DollarSign", "trend": "Real-time"},
            {"title": "Conversion Rate", "value": f"{conversion_rate:.1f}%", "icon": "Percent", "trend": "Real-time"},
        ],
        "funnelData": funnel_data,
        "revenueData": revenue_data,
    }
