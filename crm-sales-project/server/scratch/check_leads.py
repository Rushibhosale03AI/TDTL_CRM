import os
import dotenv
import django

# Load environment variables first!
dotenv.load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.dev")
django.setup()

from django.contrib.auth import get_user_model
from sales.models import Lead

User = get_user_model()

print("==================================================")
print("CRM USERS AND LEADS DATABASE SUMMARY")
print("==================================================")

users = User.objects.all()
for u in users:
    lead_count = Lead.objects.filter(owner=u, is_deleted=False).count()
    created_count = Lead.objects.filter(created_by=u, is_deleted=False).count()
    print(f"User: {u.email} | Name: {u.first_name} {u.last_name} | Role: {u.role}")
    print(f"  -> Leads Owned: {lead_count}")
    print(f"  -> Leads Created: {created_count}")
    print("-" * 50)

total_active_leads = Lead.objects.filter(is_deleted=False).count()
print(f"Total Active Leads in DB: {total_active_leads}")
print("==================================================")
