#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sales.models import EveningReport
from django.contrib.auth import get_user_model

# Check count
count = EveningReport.objects.count()
print(f"Total EveningReport records: {count}")

# Get sample records
if count > 0:
    reports = EveningReport.objects.all()[:5]
    for report in reports:
        print(f"  - {report.employee.email} | {report.report_date} | Status: {report.submission_status}")
else:
    print("  No records found")

# Check if there are any users with role SALES
User = get_user_model()
sales_users = User.objects.filter(role='SALES')
print(f"\nTotal SALES users: {sales_users.count()}")
for user in sales_users[:3]:
    print(f"  - {user.email}")

# Check managers
managers = User.objects.filter(role='MANAGER')
print(f"\nTotal MANAGER users: {managers.count()}")
for manager in managers[:3]:
    print(f"  - {manager.email}")
