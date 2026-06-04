import os
import sys
import django
from pathlib import Path
from dotenv import load_dotenv

# Define direct path to server based on the project folder location
project_server_path = Path(__file__).resolve().parents[1] / "server"
sys.path.append(str(project_server_path))

# Initialize Django env
env_path = os.path.join(project_server_path, ".env")
load_dotenv(env_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from sales.views import AICopilotViewSet
import json

User = get_user_model()
factory = APIRequestFactory()
viewset = AICopilotViewSet.as_view({'post': 'chat_assistant'})

def test_query(user_email, message):
    user = User.objects.get(email=user_email)
    print(f"\n==================================================")
    print(f"USER: {user.email} (Role: {user.role})")
    print(f"QUERY: \"{message}\"")
    print(f"==================================================")
    
    # Construct request
    request = factory.post('/api/ai/chat/', {'message': message}, format='json')
    force_authenticate(request, user=user)
    
    response = viewset(request)
    if response.status_code == 200:
        # Encode response as ASCII safe for console print
        reply_text = response.data['reply']
        # Replace emojis with standard representations for printing
        reply_text = reply_text.replace("👤", "[User]").replace("📊", "[Analytics]").replace("🏆", "[Trophy]").replace("🛡️", "[Manager]").replace("📈", "[Trend]").replace("🕒", "[EOD]").replace("🎯", "[Leads]").replace("✏️", "[Tasks]").replace("✉️", "[Email]").replace("🌟", "[Star]").replace("⏳", "[Pending]").replace("✅", "[Completed]").replace("🔥", "[Hot]")
        print(reply_text.encode('ascii', errors='replace').decode('ascii'))
    else:
        print(f"ERROR: {response.status_code} - {response.data}")

# Run queries
try:
    # 1. Sales Representative Queries
    test_query('sameer1@gmail.com', 'What tasks are pending?')
    test_query('sameer1@gmail.com', 'Show my active leads')
    test_query('sameer1@gmail.com', 'Generate a follow-up email')
    
    # 2. Administrator Queries
    test_query('admin@tdtl.in', 'Show company-wide revenue insights')
    test_query('admin@tdtl.in', 'Who has submitted their EOD reports today?')
    
except User.DoesNotExist as e:
    print(f"Error: User not found in DB. Ensure required users exist in the database. Detailed: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
