from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Endpoint for user registration.
    By default, sets role to SALES.
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


from rest_framework.decorators import action
from rest_framework import viewsets, permissions
from .permissions import IsAdminRole, IsManagerRole

class PublicManagerListView(generics.ListAPIView):
    """
    Public endpoint to get list of managers for the registration dropdown.
    """
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role="MANAGER", is_active=True).order_by("-date_joined")


class UserApprovalViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Admin/Managers to manage pending user approvals.
    """
    queryset = User.objects.filter(approval_status="PENDING")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole | IsManagerRole]

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return self.queryset
        # Managers only see pending sales reps assigned to them
        return self.queryset.filter(role="SALES", sales_profile__manager=user)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        user_to_approve = self.get_object()
        user_to_approve.approval_status = "APPROVED"
        user_to_approve.is_active = True
        user_to_approve.save()
        return Response({"detail": f"User {user_to_approve.email} approved successfully."})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        user_to_reject = self.get_object()
        user_to_reject.approval_status = "REJECTED"
        user_to_reject.is_active = False
        user_to_reject.save()
        return Response({"detail": f"User {user_to_reject.email} rejected."})


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint returning JWT access & refresh tokens.
    Access token includes user 'role'.
    Customized to provide feedback on approval status.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        try:
            user = User.objects.get(email=email)
            if not user.is_active:
                if user.approval_status == "PENDING":
                    return Response(
                        {"detail": "Your account is pending approval by a manager."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                elif user.approval_status == "REJECTED":
                    return Response(
                        {"detail": "Your account request has been rejected."},
                        status=status.HTTP_403_FORBIDDEN
                    )
        except User.DoesNotExist:
            pass
            
        return super().post(request, *args, **kwargs)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint to retrieve/update the logged-in user's profile.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD for users. 
    Admins can see/edit all. 
    Managers can see all but only edit their team.
    Sales can only see list for dropdowns.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        role_filter = self.request.query_params.get('role')
        qs = self.queryset
        if role_filter:
            qs = qs.filter(role=role_filter.upper())
        return qs
