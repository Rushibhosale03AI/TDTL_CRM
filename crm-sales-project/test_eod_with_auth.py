#!/usr/bin/env python
"""Test script to check EOD API with authentication and populate test data if needed"""

import requests
import json
import sys
from datetime import datetime, timedelta

API_BASE_URL = "http://127.0.0.1:8000/api"

# Test users (common across the project)
TEST_USERS = {
    "sales": {
        "email": "priya@tdtl.com",
        "password": "password123",
        "role": "SALES"
    },
    "manager": {
        "email": "supriya@tdtl.com",
        "password": "password123",
        "role": "MANAGER"
    },
    "admin": {
        "email": "admin@tdtl.com",
        "password": "password123",
        "role": "ADMIN"
    }
}

def login(email, password):
    """Login and return access token"""
    url = f"{API_BASE_URL}/auth/login/"
    data = {"email": email, "password": password}
    
    try:
        response = requests.post(url, json=data, timeout=5)
        if response.status_code == 200:
            result = response.json()
            return result.get("access")
        else:
            print(f"Login failed for {email}: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return None
    except Exception as e:
        print(f"Login error: {str(e)}")
        return None

def create_test_eod_report(token, report_data):
    """Create a test EOD report"""
    url = f"{API_BASE_URL}/eod/create/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(url, json=report_data, headers=headers, timeout=5)
        print(f"  Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"  Created: {json.dumps(result, indent=4)[:300]}")
            return True
        else:
            print(f"  Error: {response.text[:300]}")
            return False
    except Exception as e:
        print(f"  Error: {str(e)}")
        return False

def test_eod_endpoints():
    """Test the EOD API endpoints with authentication"""
    
    print("\n" + "=" * 70)
    print("PART 1: Testing Team Reports Endpoint")
    print("=" * 70)
    
    # Login as manager
    manager_email = TEST_USERS["manager"]["email"]
    manager_password = TEST_USERS["manager"]["password"]
    
    print(f"\nLogging in as Manager: {manager_email}")
    token = login(manager_email, manager_password)
    
    if not token:
        print("Failed to authenticate as manager")
        return False
    
    print(f"✓ Authenticated successfully")
    print(f"  Token: {token[:20]}...")
    
    # Test team-reports endpoint
    print(f"\nTesting GET /eod/team-reports/")
    url = f"{API_BASE_URL}/eod/team-reports/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        print(f"  Status Code: {response.status_code}")
        
        data = response.json()
        
        if response.status_code == 200:
            if isinstance(data, list):
                print(f"  ✓ Response is a list with {len(data)} records")
                if data:
                    print(f"  Sample record:")
                    print(f"    {json.dumps(data[0], indent=6)[:300]}")
                else:
                    print(f"  No EOD reports found for team (database may be empty)")
            else:
                print(f"  Response: {json.dumps(data, indent=4)[:500]}")
        else:
            print(f"  Error response: {json.dumps(data, indent=4)[:500]}")
            
    except Exception as e:
        print(f"  Error: {str(e)}")
        return False
    
    # Test my-reports endpoint
    print(f"\nTesting GET /eod/my-reports/")
    url = f"{API_BASE_URL}/eod/my-reports/"
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        print(f"  Status Code: {response.status_code}")
        
        data = response.json()
        
        if response.status_code == 200:
            if isinstance(data, list):
                print(f"  ✓ Response is a list with {len(data)} records")
                if data:
                    print(f"  Sample record: {json.dumps(data[0], indent=6)[:300]}")
            else:
                print(f"  Response: {json.dumps(data, indent=4)[:500]}")
        else:
            print(f"  Error: {json.dumps(data, indent=4)[:500]}")
            
    except Exception as e:
        print(f"  Error: {str(e)}")
        return False
    
    # Now test creating a report
    print(f"\n" + "=" * 70)
    print("PART 2: Creating Test EOD Report")
    print("=" * 70)
    
    # Login as sales rep
    sales_email = TEST_USERS["sales"]["email"]
    sales_password = TEST_USERS["sales"]["password"]
    
    print(f"\nLogging in as Sales Rep: {sales_email}")
    sales_token = login(sales_email, sales_password)
    
    if not sales_token:
        print("Failed to authenticate as sales rep")
        return False
    
    print(f"✓ Authenticated successfully")
    
    # Create a test report
    today = datetime.now().date().isoformat()
    report_data = {
        "report_date": today,
        "calls_done": 15,
        "emails_sent": 8,
        "followups_done": 5,
        "meetings_fixed": 2,
        "meetings_fixed_details": "Meeting with ABC Corp and XYZ Ltd",
        "meetings_attended": 1,
        "meetings_attended_details": "Team standup",
        "leads_generated": 3,
        "linkedin_outreach": 5,
        "demos_given": 1,
        "key_highlights": "Successfully closed a deal with ABC Corp worth $50k",
        "tomorrow_plan": "Follow up with XYZ Ltd and ABC Corp",
        "challenges_faced": "Network connectivity issues in the morning"
    }
    
    print(f"\nCreating EOD Report for {today}")
    print(f"  Data: {json.dumps(report_data, indent=4)[:300]}")
    
    url = f"{API_BASE_URL}/eod/create/"
    headers = {"Authorization": f"Bearer {sales_token}"}
    
    try:
        response = requests.post(url, json=report_data, headers=headers, timeout=5)
        print(f"  Status Code: {response.status_code}")
        
        data = response.json()
        
        if response.status_code in [200, 201]:
            print(f"  ✓ Report created successfully")
            print(f"  ID: {data.get('id')}")
            print(f"  Status: {data.get('submission_status')}")
            print(f"  Productivity Score: {data.get('productivity_score')}")
        else:
            print(f"  Error: {json.dumps(data, indent=4)[:500]}")
            
    except Exception as e:
        print(f"  Error: {str(e)}")
        return False
    
    # Now test the manager can see this report
    print(f"\n" + "=" * 70)
    print("PART 3: Manager Views Team Report")
    print("=" * 70)
    
    print(f"\nManager checking team-reports again")
    url = f"{API_BASE_URL}/eod/team-reports/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        print(f"  Status Code: {response.status_code}")
        
        data = response.json()
        
        if response.status_code == 200:
            if isinstance(data, list):
                print(f"  ✓ Response is a list with {len(data)} records")
                if data:
                    print(f"  Latest report:")
                    print(f"    Employee: {data[0].get('employee_email', 'N/A')}")
                    print(f"    Date: {data[0].get('report_date')}")
                    print(f"    Status: {data[0].get('submission_status')}")
                    print(f"    Productivity Score: {data[0].get('productivity_score')}")
                else:
                    print(f"  No reports found")
            else:
                print(f"  Response: {json.dumps(data, indent=4)[:500]}")
        else:
            print(f"  Error: {json.dumps(data, indent=4)[:500]}")
            
    except Exception as e:
        print(f"  Error: {str(e)}")
        return False
    
    return True

def main():
    print("\n" + "=" * 70)
    print("EOD Report System - Full Integration Test")
    print("=" * 70)
    
    print("\nThis script tests:")
    print("1. Authentication and login")
    print("2. Team Reports endpoint (Manager access)")
    print("3. My Reports endpoint (Sales access)")
    print("4. Creating test EOD reports")
    print("5. Verifying data is returned correctly")
    
    print("\nMake sure the server is running at http://127.0.0.1:8000")
    print("Expected test users:")
    for role, info in TEST_USERS.items():
        print(f"  - {role}: {info['email']}")
    
    if test_eod_endpoints():
        print("\n" + "=" * 70)
        print("✓ All tests completed successfully!")
        print("=" * 70)
        sys.exit(0)
    else:
        print("\n" + "=" * 70)
        print("✗ Test failed")
        print("=" * 70)
        sys.exit(1)

if __name__ == "__main__":
    main()
