"""
Core URL Configuration.
All API endpoints are namespaced under /api/.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework import status

def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        "status": "success",
        "message": "CRM Sales Backend is running!",
        "version": "1.0.0",
        "api_docs": "Use /api/auth/, /api/leads/, /api/contacts/, /api/deals/, /api/activities/",
        "admin_panel": "/admin/"
    }, status=status.HTTP_200_OK)

urlpatterns = [
    path("", health_check, name="health_check"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("sales.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
