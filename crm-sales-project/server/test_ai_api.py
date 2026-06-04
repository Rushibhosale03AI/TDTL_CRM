import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from sales.models import Lead

User = get_user_model()

# Login first
login_response = requests.post(
    'http://127.0.0.1:8000/api/auth/login/',
    json={'email': 'sales@test.com', 'password': 'password'}
)

if login_response.status_code == 200:
    token = login_response.json()['access']
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Get first lead
    lead = Lead.objects.filter(is_deleted=False).first()
    
    if lead:
        print(f"\n✓ Testing with Lead: {lead.name} (ID: {lead.id})")
        print(f"  Company: {lead.company}")
        print(f"  Status: {lead.status}")
        print(f"  Score: {lead.score}")
        
        # Test lead summary
        print("\n1. Testing Lead Summary API...")
        summary_response = requests.post(
            f'http://127.0.0.1:8000/api/ai/{lead.id}/lead-summary/',
            headers=headers
        )
        
        if summary_response.status_code == 200:
            data = summary_response.json()
            print(f"   ✓ Lead Summary: SUCCESS")
            print(f"   - Interest Level: {data.get('interestLevel')}")
            print(f"   - Conversion Score: {data.get('conversionScore')}")
            print(f"   - Recommended Action: {data.get('recommendedNextAction')}")
        else:
            print(f"   ✗ Lead Summary: FAILED ({summary_response.status_code})")
            print(f"   Error: {summary_response.text}")
        
        # Test sales prediction
        print("\n2. Testing Sales Prediction API...")
        prediction_response = requests.post(
            f'http://127.0.0.1:8000/api/ai/{lead.id}/sales-prediction/',
            headers=headers
        )
        
        if prediction_response.status_code == 200:
            data = prediction_response.json()
            print(f"   ✓ Sales Prediction: SUCCESS")
            print(f"   - Closing Probability: {data.get('closingProbability')}")
            print(f"   - Expected Revenue: {data.get('expectedRevenue')}")
            print(f"   - Predicted Close Date: {data.get('predictedCloseDate')}")
            print(f"   - Confidence: {data.get('confidenceInterval')}")
        else:
            print(f"   ✗ Sales Prediction: FAILED ({prediction_response.status_code})")
            print(f"   Error: {prediction_response.text}")
        
        # Test email generator
        print("\n3. Testing Email Generator API...")
        email_response = requests.post(
            'http://127.0.0.1:8000/api/ai/email-generator/',
            headers=headers,
            json={'leadId': lead.id, 'templateType': 'follow_up'}
        )
        
        if email_response.status_code == 200:
            data = email_response.json()
            print(f"   ✓ Email Generator: SUCCESS")
            print(f"   - Subject: {data.get('subject')}")
            print(f"   - Body Preview: {data.get('body')[:100]}...")
        else:
            print(f"   ✗ Email Generator: FAILED ({email_response.status_code})")
            print(f"   Error: {email_response.text}")
        
        # Test chat
        print("\n4. Testing Chat Assistant API...")
        chat_response = requests.post(
            'http://127.0.0.1:8000/api/ai/chat/',
            headers=headers,
            json={'message': 'Show my active leads'}
        )
        
        if chat_response.status_code == 200:
            data = chat_response.json()
            print(f"   ✓ Chat Assistant: SUCCESS")
            print(f"   - Reply Preview: {data.get('reply')[:200]}...")
        else:
            print(f"   ✗ Chat Assistant: FAILED ({chat_response.status_code})")
            print(f"   Error: {chat_response.text}")
        
        print("\n" + "="*60)
        print("ALL AI COPILOT FEATURES TESTED!")
        print("="*60 + "\n")
    else:
        print("✗ No leads found in database")
else:
    print(f"✗ Login failed: {login_response.status_code}")
    print(login_response.text)
