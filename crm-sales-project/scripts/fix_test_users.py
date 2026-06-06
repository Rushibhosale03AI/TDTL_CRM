"""
Script to fix test user accounts - run with: python manage.py shell < fix_test_users.py
"""
from django.contrib.auth import get_user_model, authenticate

User = get_user_model()

test_accounts = [
    {'email': 'sales@test.com', 'role': 'SALES', 'first_name': 'Sales', 'last_name': 'Rep'},
    {'email': 'manager@test.com', 'role': 'MANAGER', 'first_name': 'Manager', 'last_name': 'User'},
    {'email': 'admin@test.com', 'role': 'ADMIN', 'first_name': 'Admin', 'last_name': 'User'},
]

print("\n" + "="*60)
print("FIXING TEST USER ACCOUNTS")
print("="*60)

for account in test_accounts:
    email = account['email']
    print(f"\nProcessing: {email}")
    
    user = User.objects.filter(email=email).first()
    
    if user:
        print(f"  Found existing user")
        print(f"  - Current Active: {user.is_active}")
        print(f"  - Current Approval: {user.approval_status}")
        
        # Fix the user
        user.set_password('password')
        user.is_active = True
        user.approval_status = 'APPROVED'
        user.save()
        
        # Update profile
        if user.role == 'SALES' and hasattr(user, 'sales_profile'):
            user.sales_profile.first_name = account['first_name']
            user.sales_profile.last_name = account['last_name']
            user.sales_profile.save()
        elif user.role == 'MANAGER' and hasattr(user, 'manager_profile'):
            user.manager_profile.first_name = account['first_name']
            user.manager_profile.last_name = account['last_name']
            user.manager_profile.save()
        elif user.role == 'ADMIN' and hasattr(user, 'admin_profile'):
            user.admin_profile.first_name = account['first_name']
            user.admin_profile.last_name = account['last_name']
            user.admin_profile.save()
        
        # Test authentication
        auth_test = authenticate(username=email, password='password')
        if auth_test:
            print(f"  ✓ FIXED - Password updated, activated & approved")
            print(f"  ✓ Login test: SUCCESS")
        else:
            print(f"  ✗ Login test: FAILED (unexpected)")
    else:
        print(f"  Creating new user...")
        user = User.objects.create_user(
            email=email,
            password='password',
            role=account['role'],
            is_active=True,
            approval_status='APPROVED'
        )
        
        # Refresh to get profile
        user.refresh_from_db()
        
        # Update profile
        if user.role == 'SALES' and hasattr(user, 'sales_profile'):
            user.sales_profile.first_name = account['first_name']
            user.sales_profile.last_name = account['last_name']
            user.sales_profile.save()
        elif user.role == 'MANAGER' and hasattr(user, 'manager_profile'):
            user.manager_profile.first_name = account['first_name']
            user.manager_profile.last_name = account['last_name']
            user.manager_profile.save()
        elif user.role == 'ADMIN' and hasattr(user, 'admin_profile'):
            user.admin_profile.first_name = account['first_name']
            user.admin_profile.last_name = account['last_name']
            user.admin_profile.save()
        
        print(f"  ✓ User created successfully")

print("\n" + "="*60)
print("ALL TEST ACCOUNTS FIXED!")
print("="*60)
print("\nYou can now login with:")
print("  - sales@test.com / password")
print("  - manager@test.com / password")
print("  - admin@test.com / password")
print()
