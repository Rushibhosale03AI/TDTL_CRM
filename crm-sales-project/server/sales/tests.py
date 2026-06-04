from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Lead

User = get_user_model()

class SalesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="sales@example.com", password="password123", role="SALES"
        )
        self.client.force_authenticate(user=self.user)

    def test_create_lead(self):
        data = {
            "name": "Acme Corp",
            "email": "contact@acme.com",
            "phone": "555-1234",
            "source": "Website"
        }
        response = self.client.post("/api/leads/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lead.objects.count(), 1)
        
        lead = Lead.objects.first()
        self.assertEqual(lead.owner, self.user)
        self.assertEqual(lead.created_by, self.user)

    def test_sales_dashboard(self):
        Lead.objects.create(name="Lead 1", owner=self.user)
        Lead.objects.create(name="Lead 2", owner=self.user)
        
        response = self.client.get("/api/dashboard/sales/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["kpiCards"][0]["value"], 2)
