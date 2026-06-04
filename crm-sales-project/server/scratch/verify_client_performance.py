import time
import requests
import json

base_url = "http://127.0.0.1:8000/api"

print("==================================================")
print("VERIFYING CLIENT PERFORMANCE SIMULATION")
print("==================================================")

# 1. Test Authentication for sameer1@gmail.com
t0 = time.time()
try:
    auth_response = requests.post(f"{base_url}/auth/login/", json={
        "email": "sameer1@gmail.com",
        "password": "#supriya2003"
    })
    t1 = time.time()
    if auth_response.status_code != 200:
        print(f"[-] Authentication failed: {auth_response.status_code} {auth_response.text}")
        exit(1)
        
    auth_data = auth_response.json()
    token = auth_data.get("access")
    print(f"[+] Authenticated successfully in {t1 - t0:.4f} seconds")
except Exception as e:
    print(f"[-] Auth request failed: {e}")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 2. Fetch Leads List (Simulating Leads Dashboard Mount)
t2 = time.time()
try:
    list_response = requests.get(f"{base_url}/leads/", headers=headers)
    t3 = time.time()
    if list_response.status_code != 200:
        print(f"[-] Fetch leads failed: {list_response.status_code}")
        exit(1)
        
    leads_data = list_response.json()
    count = leads_data.get("count", 0)
    results = leads_data.get("results", [])
    print(f"[+] Loaded {len(results)} leads (Total: {count}) in {t3 - t2:.4f} seconds")
except Exception as e:
    print(f"[-] Fetch leads request failed: {e}")
    exit(1)

# 3. Create a Lead (Simulating '+ Add New Row' Click)
t4 = time.time()
try:
    create_payload = {
        "name": "Performance Test Lead",
        "company": "Fast Inc",
        "email": "test-fast@example.com",
        "phone": "9998887776",
        "designation": "QA Engineer",
        "status": "Yet to approach",
        "custom_fields": {
            "Meeting Date": "",
            "Outcome (Qualified / Not Qualified / Follow-up)": "Follow-up",
            "Demo Call": "NO",
            "Proposal Sent": "N/A",
            "Closures": "N/A"
        }
    }
    create_response = requests.post(f"{base_url}/leads/", headers=headers, json=create_payload)
    t5 = time.time()
    if create_response.status_code != 201:
        print(f"[-] Create lead failed: {create_response.status_code} {create_response.text}")
        exit(1)
        
    new_lead = create_response.json()
    new_lead_id = new_lead.get("id")
    print(f"[+] Created New Lead row (ID: {new_lead_id}) in {t5 - t4:.4f} seconds")
except Exception as e:
    print(f"[-] Create lead request failed: {e}")
    exit(1)

# 4. Clean up created lead
try:
    delete_response = requests.delete(f"{base_url}/leads/{new_lead_id}/", headers=headers)
    if delete_response.status_code in [200, 204]:
        print(f"[+] Cleaned up test lead successfully")
except Exception as e:
    print(f"[-] Clean up failed: {e}")

print("==================================================")
print("VERIFICATION COMPLETED")
print("==================================================")
