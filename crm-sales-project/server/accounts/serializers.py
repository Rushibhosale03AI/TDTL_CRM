from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from sales.models import Team

User = get_user_model()


from .models import AdminProfile, ManagerProfile, SalesProfile

class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        exclude = ("user",)

class ManagerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagerProfile
        exclude = ("user",)

class SalesProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesProfile
        exclude = ("user",)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer to include role in token payload."""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra responses here
        data["role"] = self.user.role.lower()
        data["email"] = self.user.email
        data["id"] = self.user.id
        
        # Get first name from profile
        first_name = ""
        if self.user.role == "SALES" and hasattr(self.user, 'sales_profile'):
            first_name = self.user.sales_profile.first_name
        elif self.user.role == "MANAGER" and hasattr(self.user, 'manager_profile'):
            first_name = self.user.manager_profile.first_name
        elif self.user.role == "ADMIN" and hasattr(self.user, 'admin_profile'):
            first_name = self.user.admin_profile.first_name
            
        data["first_name"] = first_name
        return data


class UserSerializer(serializers.ModelSerializer):
    """Basic user details including role-specific profile."""
    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ("id", "email", "role", "is_active", "approval_status", "name")
        read_only_fields = ("role", "is_active", "approval_status")

    def get_role(self, obj):
        return obj.role.lower()

    def get_name(self, obj):
        profile = None
        if obj.role == "SALES" and hasattr(obj, 'sales_profile'):
            profile = obj.sales_profile
        elif obj.role == "MANAGER" and hasattr(obj, 'manager_profile'):
            profile = obj.manager_profile
        elif obj.role == "ADMIN" and hasattr(obj, 'admin_profile'):
            profile = obj.admin_profile
        
        if profile:
            return f"{profile.first_name} {profile.last_name}".strip() or obj.email
        return obj.email


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.CharField(write_only=True, required=False)
    managerId = serializers.IntegerField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name", "role", "managerId", "phone")

    def create(self, validated_data):
        first_name = validated_data.pop("first_name", "")
        last_name = validated_data.pop("last_name", "")
        phone = validated_data.pop("phone", "")
        role = validated_data.pop("role", User.Role.SALES).upper()
        manager_id = validated_data.pop("managerId", None)
        
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            role=role,
        )
        
        # Auto-approve Managers and Admins for testing
        if role in ["MANAGER", "ADMIN"]:
            user.approval_status = "APPROVED"
            user.is_active = True
            user.save()
        
        # Refresh to ensure profiles created in signals are attached
        user.refresh_from_db()
        
        # Populate the profile that was automatically created via the post_save signal
        if role == "SALES" and hasattr(user, 'sales_profile'):
            user.sales_profile.first_name = first_name
            user.sales_profile.last_name = last_name
            user.sales_profile.phone_number = phone
            user.sales_profile.save()
        elif role == "MANAGER" and hasattr(user, 'manager_profile'):
            user.manager_profile.first_name = first_name
            user.manager_profile.last_name = last_name
            user.manager_profile.phone_number = phone
            user.manager_profile.save()
        elif role == "ADMIN" and hasattr(user, 'admin_profile'):
            user.admin_profile.first_name = first_name
            user.admin_profile.last_name = last_name
            user.admin_profile.phone_number = phone
            user.admin_profile.save()
        
        # Add to a Team and set manager if managerId is provided and role is SALES
        if role == "SALES" and manager_id:
            try:
                manager = User.objects.get(id=manager_id, role="MANAGER")
                
                # Update profile manager
                if hasattr(user, 'sales_profile'):
                    user.sales_profile.manager = manager
                    user.sales_profile.save()
                
                # Find or create a team for this manager safely
                team = Team.objects.filter(manager=manager).first()
                if not team:
                    team = Team.objects.create(
                        manager=manager,
                        name=f"Team managed by {manager.email}"
                    )
                team.members.add(user)
            except User.DoesNotExist:
                pass
                
        return user
