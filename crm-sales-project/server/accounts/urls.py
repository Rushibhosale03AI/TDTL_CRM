from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

from .views import RegisterView, CustomTokenObtainPairView, UserProfileView, UserViewSet, UserApprovalViewSet, PublicManagerListView

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"approvals", UserApprovalViewSet, basename="approval")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("managers/", PublicManagerListView.as_view(), name="public_managers"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", UserProfileView.as_view(), name="user_profile"),
    path("", include(router.urls)),
]
