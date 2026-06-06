#!/usr/bin/env python
"""Check existing users in the database"""

import requests
import json
import sys

API_BASE_URL = "http://127.0.0.1:8000/api"

# Try some common credentials
COMMON_CREDENTIALS = [
    ("admin@tdtl.com", "password123"),
    ("admin@example.com", "admin123"),
    ("test@test.com", "test123"),
    ("demo@tdtl.com", "demo123"),
    ("manager@tdtl.com", "password123"),
    ("sales@tdtl.com", "password123"),
    ("priya@tdtl.com", "priya123"),
]

def try_login(email, password):
    """Try to login with given credentials"""
    url = f"{API_BASE_URL}/auth/login/"
    data = {"email": email, "password": password}
    
    try:
        response = requests.post(url, json=data, timeout=5)
        if response.status_code == 200:
            result = response.json()
            return True, result.get("access")
        return False, None
    except:
        return False, None

def get_profile(token):
    """Get user profile info"""
    url = f"{API_BASE_URL}/auth/me/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

def main():
    print("\n" + "=" * 70)
    print("Checking Available Users")
    print("=" * 70 + "\n")
    
    print(f"Testing common credentials...\n")
    
    found_any = False
    for email, password in COMMON_CREDENTIALS:
        success, token = try_login(email, password)
        if success:
            found_any = True
            print(f"✓ Found valid user: {email}")
            
            profile = get_profile(token)
            if profile:
                print(f"  Role: {profile.get('role', 'N/A')}")
                print(f"  Name: {profile.get('first_name', '')} {profile.get('last_name', '')}")
                print(f"  ID: {profile.get('id')}")
            print()
    
    if not found_any:
        print("✗ No valid credentials found from common test accounts")
        print("\nPlease check:")
        print("  1. Is the server running?")
        print("  2. Are test users created?")
        print("  3. Check the project's seed data or user creation scripts")
    else:
        print("\n" + "=" * 70)
        print("Note: Use one of these credentials to test EOD endpoints")
        print("=" * 70)

if __name__ == "__main__":
    main()
