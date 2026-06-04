import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.dev')
django.setup()

from django.contrib.auth import get_user_model, authenticate

User = get_user_model()

test_emails = ['sales@test.com', 'manager@test.com', 'admin@test.com']

print("\n" + "="*60)
print("CHECKING TEST USER ACCOUNTS")
print("="*60)

for email in test_emails:
    print(f"\n{email}:")
    user = User.objects.filter(email=email).first()
    
    if user:
        print(f"  ✓ Exists: YES")
        print(f"  - Active: {user.is_active}")
        print(f"  - Approval Status: {user.approval_status}")
        print(f"  - Role: {user.role}")
        
        # Test authentication
        auth_result = authenticate(username=email, password='password')
        if auth_result:
            print(f"  ✓ Password Test: SUCCESS")
        else:
            print(f"  ✗ Password Test: FAILED")
            print(f"  → Attempting to fix password...")
            user.set_password('password')
            user.is_active = True
            user.approval_status = 'APPROVED'
            user.save()
            print(f"  ✓ Password updated, user activated & approved")
    else:
        print(f"  ✗ Exists: NO")
        print(f"  → Creating user...")
        
        role = 'SALES' if 'sales' in email else 'MANAGER' if 'manager' in email else 'ADMIN'
        user = User.objects.create_user(
            email=email,
            password='password',
            role=role,
            is_active=True,
            approval_status='APPROVED'
        )
        
        # Update profile
        if role == 'SALES' and hasattr(user, 'sales_profile'):
            user.sales_profile.first_name = 'Sales'
            user.sales_profile.last_name = 'User'
            user.sales_profile.save()
        elif role == 'MANAGER' and hasattr(user, 'manager_profile'):
            user.manager_profile.first_name = 'Manager'
            user.manager_profile.last_name = 'User'
            user.manager_profile.save()
        elif role == 'ADMIN' and hasattr(user, 'admin_profile'):
            user.admin_profile.first_name = 'Admin'
            user.admin_profile.last_name = 'User'
            user.admin_profile.save()
            
        print(f"  ✓ User created successfully")

print("\n" + "="*60)
print("VERIFICATION COMPLETE")
print("="*60 + "\n")
