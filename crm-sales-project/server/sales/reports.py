from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from .models import Deal, Lead

User = get_user_model()


def generate_sales_report(user, report_type="revenue"):
    leads = Lead.objects.filter(is_deleted=False)
    deals = Deal.objects.filter(is_deleted=False)

    if user.role == User.Role.MANAGER:
        team_member_ids = User.objects.filter(sales_teams__manager=user).values_list("id", flat=True)
        leads = leads.filter(Q(owner=user) | Q(owner__id__in=team_member_ids))
        deals = deals.filter(Q(owner=user) | Q(owner__id__in=team_member_ids))
    elif user.role == User.Role.SALES:
        leads = leads.filter(owner=user)
        deals = deals.filter(owner=user)

    if report_type == "revenue":
        won_leads = leads.filter(status=Lead.StatusChoices.WON)
        pipeline_leads = leads.exclude(status__in=[Lead.StatusChoices.WON, Lead.StatusChoices.LOST])
        won_deals = deals.filter(stage=Deal.StageChoices.CLOSED_WON)

        return {
            "reportTitle": "Revenue & Pipeline Performance",
            "metrics": {
                "totalRevenue": float(won_leads.aggregate(total=Sum("value"))["total"] or 0),
                "pipelineValue": float(pipeline_leads.aggregate(total=Sum("value"))["total"] or 0),
                "winRate": f"{(won_leads.count() / max(1, leads.count()) * 100):.1f}%",
                "closedDealValue": float(won_deals.aggregate(total=Sum("amount"))["total"] or 0),
                "openPipelineCount": pipeline_leads.count(),
            },
            "breakdown": [
                {"category": "Deals Closed", "amount": float(won_deals.aggregate(total=Sum("amount"))["total"] or 0)},
                {"category": "Prospecting", "amount": float(deals.filter(stage=Deal.StageChoices.PROSPECTING).aggregate(total=Sum("amount"))["total"] or 0)},
                {"category": "Proposal", "amount": float(deals.filter(stage=Deal.StageChoices.PROPOSAL).aggregate(total=Sum("amount"))["total"] or 0)},
                {"category": "Negotiation", "amount": float(deals.filter(stage=Deal.StageChoices.NEGOTIATION).aggregate(total=Sum("amount"))["total"] or 0)},
            ],
        }

    if report_type == "activity":
        team_members = User.objects.filter(role=User.Role.SALES)
        if user.role == User.Role.MANAGER:
            team_member_ids = User.objects.filter(sales_teams__manager=user).values_list("id", flat=True)
            team_members = team_members.filter(id__in=team_member_ids)
        elif user.role == User.Role.SALES:
            team_members = team_members.filter(id=user.id)

        performance_list = []
        for member in team_members:
            member_leads = leads.filter(owner=member)
            member_rev = member_leads.filter(status=Lead.StatusChoices.WON).aggregate(total=Sum("value"))["total"] or 0
            performance_list.append({
                "name": member.get_full_name() or member.email,
                "revenue": float(member_rev),
                "leadsCount": member_leads.count(),
                "wonCount": member_leads.filter(status=Lead.StatusChoices.WON).count(),
            })

        return {
            "reportTitle": "Sales Rep Performance Report",
            "breakdown": performance_list,
        }

    return {
        "reportTitle": "Summary Report",
        "metrics": {
            "totalLeads": leads.count(),
            "totalDeals": deals.count(),
        },
    }
