#!/usr/bin/env python
"""Test script to check EOD/EveningReport API endpoints and data"""

import requests
import json
import sys
from datetime import datetime, timedelta

API_BASE_URL = "http://127.0.0.1:8000/api"

def test_eod_endpoints():
    """Test the EOD API endpoints"""
    
    print("=" * 70)
    print("EOD API Endpoint Test")
    print("=" * 70)
    print(f"\nBase URL: {API_BASE_URL}\n")
    
    # Try without authentication first (to see what error we get)
    endpoints = [
        ("GET", "eod/my-reports/", "Get user's own EOD reports"),
        ("GET", "eod/team-reports/", "Get team's EOD reports (Manager only)"),
        ("GET", "eod/all-reports/", "Get all EOD reports (Admin only)"),
        ("GET", "eod/analytics/", "Get EOD analytics"),
    ]
    
    for method, endpoint, description in endpoints:
        url = f"{API_BASE_URL}/{endpoint}"
        print(f"\n{method} {endpoint}")
        print(f"Description: {description}")
        print(f"Full URL: {url}")
        
        try:
            if method == "GET":
                response = requests.get(url, timeout=5)
            else:
                response = requests.post(url, timeout=5)
                
            print(f"Status Code: {response.status_code}")
            
            try:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)[:500]}")  # First 500 chars
            except:
                print(f"Response: {response.text[:500]}")
                
        except requests.exceptions.ConnectionError:
            print("ERROR: Cannot connect to server. Make sure the server is running at http://127.0.0.1:8000")
            return False
        except Exception as e:
            print(f"ERROR: {str(e)}")
    
    return True

def main():
    print("\n" + "=" * 70)
    print("EOD Report Database & API Test")
    print("=" * 70)
    
    print("\nThis script tests:")
    print("1. EOD API endpoint connectivity")
    print("2. Response formats")
    print("3. Whether data exists in the database")
    
    print("\nMake sure the server is running at http://127.0.0.1:8000")
    print("Expected users to be created already\n")
    
    if test_eod_endpoints():
        print("\n" + "=" * 70)
        print("Test completed successfully")
        print("=" * 70)
        sys.exit(0)
    else:
        print("\n" + "=" * 70)
        print("Test failed - server connection error")
        print("=" * 70)
        sys.exit(1)

if __name__ == "__main__":
    main()
