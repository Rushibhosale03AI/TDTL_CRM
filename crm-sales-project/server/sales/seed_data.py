"""
Seed static data for the CRM application for testing and demo purposes
"""
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .models import (
    Team, Lead, Contact, Deal, Activity, Task, 
    EveningReport, Document, ActivityLog, Notification
)
from accounts.models import AdminProfile, ManagerProfile, SalesProfile

User = get_user_model()

def create_seed_users():
    """Create demo users with all roles"""
    
    # Admin user
    admin_user, _ = User.objects.get_or_create(
        email='admin@tdtl.com',
        defaults={
            'first_name': 'Admin',
            'last_name': 'User',
            'role': User.Role.ADMIN,
            'approval_status': User.ApprovalStatus.APPROVED,
            'is_active': True,
            'is_staff': True,
        }
    )
    if not admin_user.has_usable_password():
        admin_user.set_password('admin123')
        admin_user.save()
    
    # Create admin profile if not exists
    AdminProfile.objects.get_or_create(
        user=admin_user,
        defaults={
            'first_name': 'Admin',
            'last_name': 'User',
            'phone_number': '+1-800-ADMIN',
            'department': 'Executive',
            'access_level': 'Super Admin',
            'can_manage_billing': True,
            'can_manage_users': True,
        }
    )

    # Manager users
    manager_data = [
        {
            'email': 'supriya@tdtl.com',
            'first_name': 'Supriya',
            'last_name': 'Sharma',
            'phone_number': '+1-555-0101',
            'region': 'India - South',
            'team_budget': Decimal('500000.00'),
            'monthly_target': Decimal('100000.00'),
        },
        {
            'email': 'rahul@tdtl.com',
            'first_name': 'Rahul',
            'last_name': 'Kumar',
            'phone_number': '+1-555-0102',
            'region': 'India - North',
            'team_budget': Decimal('450000.00'),
            'monthly_target': Decimal('90000.00'),
        },
    ]

    managers = []
    for manager_info in manager_data:
        manager, _ = User.objects.get_or_create(
            email=manager_info['email'],
            defaults={
                'first_name': manager_info['first_name'],
                'last_name': manager_info['last_name'],
                'role': User.Role.MANAGER,
                'approval_status': User.ApprovalStatus.APPROVED,
                'is_active': True,
            }
        )
        if not manager.has_usable_password():
            manager.set_password('manager123')
            manager.save()
        
        # Create manager profile
        ManagerProfile.objects.get_or_create(
            user=manager,
            defaults={
                'first_name': manager_info['first_name'],
                'last_name': manager_info['last_name'],
                'phone_number': manager_info['phone_number'],
                'region': manager_info['region'],
                'team_budget': manager_info['team_budget'],
                'monthly_target': manager_info['monthly_target'],
            }
        )
        managers.append(manager)

    # Sales rep users
    sales_reps_data = [
        {
            'email': 'priya@tdtl.com',
            'first_name': 'Priya',
            'last_name': 'Singh',
            'phone_number': '+1-555-0201',
            'manager': managers[0],
            'territory': 'Bangalore',
            'target_quota': Decimal('25000.00'),
            'commission_rate': Decimal('5.00'),
        },
        {
            'email': 'ashwini@tdtl.com',
            'first_name': 'Ashwini',
            'last_name': 'Desai',
            'phone_number': '+1-555-0202',
            'manager': managers[0],
            'territory': 'Chennai',
            'target_quota': Decimal('25000.00'),
            'commission_rate': Decimal('5.00'),
        },
        {
            'email': 'rajesh@tdtl.com',
            'first_name': 'Rajesh',
            'last_name': 'Patel',
            'phone_number': '+1-555-0203',
            'manager': managers[1],
            'territory': 'Delhi',
            'target_quota': Decimal('30000.00'),
            'commission_rate': Decimal('5.00'),
        },
        {
            'email': 'neha@tdtl.com',
            'first_name': 'Neha',
            'last_name': 'Gupta',
            'phone_number': '+1-555-0204',
            'manager': managers[1],
            'territory': 'Mumbai',
            'target_quota': Decimal('30000.00'),
            'commission_rate': Decimal('5.00'),
        },
    ]

    sales_reps = []
    for rep_info in sales_reps_data:
        rep, _ = User.objects.get_or_create(
            email=rep_info['email'],
            defaults={
                'first_name': rep_info['first_name'],
                'last_name': rep_info['last_name'],
                'role': User.Role.SALES,
                'approval_status': User.ApprovalStatus.APPROVED,
                'is_active': True,
            }
        )
        if not rep.has_usable_password():
            rep.set_password('sales123')
            rep.save()
        
        # Create sales profile
        SalesProfile.objects.get_or_create(
            user=rep,
            defaults={
                'first_name': rep_info['first_name'],
                'last_name': rep_info['last_name'],
                'phone_number': rep_info['phone_number'],
                'manager': rep_info['manager'],
                'territory': rep_info['territory'],
                'target_quota': rep_info['target_quota'],
                'commission_rate': rep_info['commission_rate'],
            }
        )
        sales_reps.append(rep)

    return {
        'admin': admin_user,
        'managers': managers,
        'sales_reps': sales_reps,
    }


def create_seed_teams(managers, sales_reps):
    """Create teams and assign members"""
    
    teams = []
    
    # South India Team
    team1, _ = Team.objects.get_or_create(
        name='South India Sales Team',
        defaults={
            'manager': managers[0],
            'created_by': managers[0],
        }
    )
    team1.members.set(sales_reps[0:2])
    teams.append(team1)
    
    # North India Team
    team2, _ = Team.objects.get_or_create(
        name='North India Sales Team',
        defaults={
            'manager': managers[1],
            'created_by': managers[1],
        }
    )
    team2.members.set(sales_reps[2:4])
    teams.append(team2)
    
    return teams


def create_seed_leads(sales_reps):
    """Create demo leads"""
    
    leads_data = [
        {
            'name': 'priya - TechInfo Tech',
            'company': 'TechInfo Tech',
            'email': 'contact@techinfo.com',
            'phone': '+91-90000-00001',
            'designation': 'CTO',
            'industry': 'Information Technology',
            'location': 'Bangalore',
            'source': 'Linkedin',
            'status': 'Yet to approach',
            'value': Decimal('50000.00'),
            'owner': sales_reps[0],
        },
        {
            'name': 'New Lead - New Company',
            'company': 'New Company',
            'email': 'info@newcompany.com',
            'phone': '+91-90000-00002',
            'designation': 'Manager',
            'industry': 'Finance',
            'location': 'Chennai',
            'source': 'Cold Call',
            'status': 'Yet to approach',
            'value': Decimal('40000.00'),
            'owner': sales_reps[1],
        },
        {
            'name': 'supriya - TDTL',
            'company': 'TDTL',
            'email': 'supriya@tdtl.com',
            'phone': '+91-90000-00003',
            'designation': 'Director',
            'industry': 'Business Services',
            'location': 'Bangalore',
            'source': 'Referral',
            'status': 'Yet to approach',
            'value': Decimal('75000.00'),
            'owner': sales_reps[0],
        },
        {
            'name': 'ashwini - Global Tech',
            'company': 'Global Tech',
            'email': 'ashwini@globaltech.com',
            'phone': '+91-90000-00004',
            'designation': 'VP Sales',
            'industry': 'Software',
            'location': 'Delhi',
            'source': 'Email',
            'status': 'Yet to approach',
            'value': Decimal('100000.00'),
            'owner': sales_reps[2],
        },
        {
            'name': 'Rajesh - Enterprise Solutions',
            'company': 'Enterprise Solutions',
            'email': 'rajesh@enterprise.com',
            'phone': '+91-90000-00005',
            'designation': 'Head - IT',
            'industry': 'Enterprise Software',
            'location': 'Mumbai',
            'source': 'Event',
            'status': 'Yet to approach',
            'value': Decimal('120000.00'),
            'owner': sales_reps[3],
        },
    ]

    leads = []
    for lead_data in leads_data:
        lead, _ = Lead.objects.get_or_create(
            email=lead_data['email'],
            defaults=lead_data
        )
        leads.append(lead)

    return leads


def create_seed_contacts(leads, sales_reps):
    """Create demo contacts"""
    
    contacts_data = [
        {
            'name': 'John Smith',
            'email': 'john.smith@techinfo.com',
            'phone': '+91-90000-10001',
            'company': 'TechInfo Tech',
            'industry': 'IT',
            'designation': 'Project Manager',
            'location': 'Bangalore',
            'lead': leads[0],
            'owner': sales_reps[0],
        },
        {
            'name': 'Sarah Johnson',
            'email': 'sarah@newcompany.com',
            'phone': '+91-90000-10002',
            'company': 'New Company',
            'industry': 'Finance',
            'designation': 'Finance Head',
            'location': 'Chennai',
            'lead': leads[1],
            'owner': sales_reps[1],
        },
        {
            'name': 'Amit Kumar',
            'email': 'amit@globaltech.com',
            'phone': '+91-90000-10003',
            'company': 'Global Tech',
            'industry': 'Software',
            'designation': 'Operations Manager',
            'location': 'Delhi',
            'lead': leads[3],
            'owner': sales_reps[2],
        },
    ]

    contacts = []
    for contact_data in contacts_data:
        contact, _ = Contact.objects.get_or_create(
            email=contact_data['email'],
            defaults=contact_data
        )
        contacts.append(contact)

    return contacts


def create_seed_deals(leads, sales_reps):
    """Create demo deals"""
    
    deals_data = [
        {
            'name': 'TechInfo - Enterprise Solution',
            'lead': leads[0],
            'owner': sales_reps[0],
            'stage': Deal.StageChoices.PROPOSAL,
            'amount': Decimal('50000.00'),
            'probability': 60,
            'close_date': timezone.now().date() + timedelta(days=30),
        },
        {
            'name': 'New Company - Implementation',
            'lead': leads[1],
            'owner': sales_reps[1],
            'stage': Deal.StageChoices.NEGOTIATION,
            'amount': Decimal('40000.00'),
            'probability': 75,
            'close_date': timezone.now().date() + timedelta(days=15),
        },
        {
            'name': 'TDTL - Premium Package',
            'lead': leads[2],
            'owner': sales_reps[0],
            'stage': Deal.StageChoices.CLOSED_WON,
            'amount': Decimal('75000.00'),
            'probability': 100,
            'close_date': timezone.now().date() - timedelta(days=5),
        },
        {
            'name': 'Global Tech - Full Suite',
            'lead': leads[3],
            'owner': sales_reps[2],
            'stage': Deal.StageChoices.PROSPECTING,
            'amount': Decimal('100000.00'),
            'probability': 30,
            'close_date': timezone.now().date() + timedelta(days=60),
        },
    ]

    deals = []
    for deal_data in deals_data:
        deal, _ = Deal.objects.get_or_create(
            name=deal_data['name'],
            owner=deal_data['owner'],
            defaults=deal_data
        )
        deals.append(deal)

    return deals


def create_seed_activities(leads, sales_reps):
    """Create demo activities"""
    
    activities_data = [
        {
            'type': Activity.TypeChoices.CALL,
            'content': 'Initial call with TechInfo to discuss requirements',
            'user': sales_reps[0],
            'lead': leads[0],
        },
        {
            'type': Activity.TypeChoices.EMAIL,
            'content': 'Sent proposal and pricing information to New Company',
            'user': sales_reps[1],
            'lead': leads[1],
        },
        {
            'type': Activity.TypeChoices.MEETING,
            'content': 'Demo meeting scheduled with TDTL team',
            'user': sales_reps[0],
            'lead': leads[2],
        },
        {
            'type': Activity.TypeChoices.NOTE,
            'content': 'Follow-up needed for Global Tech next week',
            'user': sales_reps[2],
            'lead': leads[3],
        },
    ]

    activities = []
    for activity_data in activities_data:
        activity = Activity.objects.create(**activity_data)
        activities.append(activity)

    return activities


def create_seed_tasks(sales_reps):
    """Create demo tasks"""
    
    tasks_data = [
        {
            'title': 'Follow up with TechInfo',
            'description': 'Check on proposal status',
            'assigned_to': sales_reps[0],
            'due_date': timezone.now() + timedelta(days=2),
            'priority': Task.PriorityChoices.HIGH,
            'status': Task.StatusChoices.IN_PROGRESS,
            'progress_percentage': 50,
        },
        {
            'title': 'Send contracts to New Company',
            'description': 'Finalize contract terms and send for review',
            'assigned_to': sales_reps[1],
            'due_date': timezone.now() + timedelta(days=1),
            'priority': Task.PriorityChoices.URGENT,
            'status': Task.StatusChoices.TODO,
            'progress_percentage': 0,
        },
        {
            'title': 'Prepare demo for Global Tech',
            'description': 'Customize demo for Global Tech requirements',
            'assigned_to': sales_reps[2],
            'due_date': timezone.now() + timedelta(days=5),
            'priority': Task.PriorityChoices.MEDIUM,
            'status': Task.StatusChoices.TODO,
            'progress_percentage': 20,
        },
        {
            'title': 'Client presentation',
            'description': 'Present solution to Enterprise Solutions',
            'assigned_to': sales_reps[3],
            'due_date': timezone.now() + timedelta(days=3),
            'priority': Task.PriorityChoices.HIGH,
            'status': Task.StatusChoices.COMPLETED,
            'progress_percentage': 100,
        },
    ]

    tasks = []
    for task_data in tasks_data:
        task, _ = Task.objects.get_or_create(
            title=task_data['title'],
            assigned_to=task_data['assigned_to'],
            defaults=task_data
        )
        tasks.append(task)

    return tasks


def create_seed_evening_reports(sales_reps, managers):
    """Create demo evening reports"""
    
    today = timezone.now().date()
    
    reports_data = [
        {
            'employee': sales_reps[0],
            'manager': managers[0],
            'report_date': today,
            'calls_done': 5,
            'emails_sent': 8,
            'followups_done': 3,
            'meetings_fixed': 2,
            'meetings_fixed_details': 'Meeting with TechInfo on Monday, New Company on Wednesday',
            'meetings_attended': 1,
            'meetings_attended_details': 'Demo presentation to existing client',
            'leads_generated': 2,
            'linkedin_outreach': 15,
            'demos_given': 1,
            'key_highlights': 'Closed deal with TDTL worth ₹75k, strong pipeline built',
            'tomorrow_plan': 'Follow up on pending proposals, attend sales meeting',
            'challenges_faced': 'Client delayed response, need to reschedule meeting',
            'submission_status': EveningReport.StatusChoices.SUBMITTED,
        },
        {
            'employee': sales_reps[1],
            'manager': managers[0],
            'report_date': today,
            'calls_done': 6,
            'emails_sent': 10,
            'followups_done': 4,
            'meetings_fixed': 1,
            'meetings_fixed_details': 'Meeting with New Company on Thursday',
            'meetings_attended': 2,
            'meetings_attended_details': 'Client review meeting, team sync',
            'leads_generated': 3,
            'linkedin_outreach': 20,
            'demos_given': 2,
            'key_highlights': 'New opportunity in finance sector identified',
            'tomorrow_plan': 'Send proposals, prepare contracts',
            'challenges_faced': 'Budget approval pending from client',
            'submission_status': EveningReport.StatusChoices.SUBMITTED,
        },
        {
            'employee': sales_reps[2],
            'manager': managers[1],
            'report_date': today - timedelta(days=1),
            'calls_done': 4,
            'emails_sent': 7,
            'followups_done': 2,
            'meetings_fixed': 1,
            'meetings_fixed_details': 'Meeting with Global Tech scheduled',
            'meetings_attended': 1,
            'meetings_attended_details': 'Partner meeting',
            'leads_generated': 1,
            'linkedin_outreach': 12,
            'demos_given': 1,
            'key_highlights': 'Good pipeline buildup, multiple opportunities',
            'tomorrow_plan': 'Prepare for Global Tech demo',
            'challenges_faced': 'Client requested custom solution',
            'submission_status': EveningReport.StatusChoices.APPROVED,
            'manager_remarks': 'Good performance. Need to close at least one deal next week.',
        },
    ]

    reports = []
    for report_data in reports_data:
        report, _ = EveningReport.objects.get_or_create(
            employee=report_data['employee'],
            report_date=report_data['report_date'],
            defaults=report_data
        )
        reports.append(report)

    return reports


def create_seed_notifications(users_list):
    """Create demo notifications"""
    
    notifications_data = [
        {
            'user': users_list[2],  # First sales rep
            'message': 'Your proposal for TechInfo has been viewed',
            'read': False,
        },
        {
            'user': users_list[2],
            'message': 'Reminder: Evening report due at 6 PM',
            'read': False,
        },
        {
            'user': users_list[3],  # Second sales rep
            'message': 'New lead assigned to you: Global Tech',
            'read': True,
        },
        {
            'user': users_list[0],  # Manager 1
            'message': 'Team revenue target reached for the month!',
            'read': False,
        },
    ]

    notifications = []
    for notif_data in notifications_data:
        notification = Notification.objects.create(**notif_data)
        notifications.append(notification)

    return notifications


def create_seed_activity_logs(users_list):
    """Create demo activity logs"""
    
    logs_data = [
        {
            'user': users_list[2],
            'action': 'Created new lead',
            'module': 'Leads',
            'ip_address': '192.168.1.100',
        },
        {
            'user': users_list[2],
            'action': 'Updated deal status',
            'module': 'Deals',
            'ip_address': '192.168.1.100',
        },
        {
            'user': users_list[0],
            'action': 'Viewed team performance',
            'module': 'Dashboard',
            'ip_address': '192.168.1.101',
        },
    ]

    logs = []
    for log_data in logs_data:
        log = ActivityLog.objects.create(**log_data)
        logs.append(log)

    return logs


def run_seed():
    """Run all seed data creation"""
    print("🌱 Starting seed data creation...")
    
    # Create users
    print("👥 Creating users...")
    users = create_seed_users()
    all_users = [users['admin']] + users['managers'] + users['sales_reps']
    
    # Create teams
    print("👫 Creating teams...")
    teams = create_seed_teams(users['managers'], users['sales_reps'])
    
    # Create leads
    print("📋 Creating leads...")
    leads = create_seed_leads(users['sales_reps'])
    
    # Create contacts
    print("📞 Creating contacts...")
    contacts = create_seed_contacts(leads, users['sales_reps'])
    
    # Create deals
    print("💰 Creating deals...")
    deals = create_seed_deals(leads, users['sales_reps'])
    
    # Create activities
    print("📝 Creating activities...")
    activities = create_seed_activities(leads, users['sales_reps'])
    
    # Create tasks
    print("✓ Creating tasks...")
    tasks = create_seed_tasks(users['sales_reps'])
    
    # Create evening reports
    print("📊 Creating evening reports...")
    reports = create_seed_evening_reports(users['sales_reps'], users['managers'])
    
    # Create notifications
    print("🔔 Creating notifications...")
    notifications = create_seed_notifications(all_users)
    
    # Create activity logs
    print("📋 Creating activity logs...")
    logs = create_seed_activity_logs(all_users)
    
    print("✅ Seed data creation completed successfully!")
    print(f"   - Created {len(all_users)} users")
    print(f"   - Created {len(teams)} teams")
    print(f"   - Created {len(leads)} leads")
    print(f"   - Created {len(contacts)} contacts")
    print(f"   - Created {len(deals)} deals")
    print(f"   - Created {len(activities)} activities")
    print(f"   - Created {len(tasks)} tasks")
    print(f"   - Created {len(reports)} evening reports")
    print(f"   - Created {len(notifications)} notifications")
    print(f"   - Created {len(logs)} activity logs")
