from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    """Custom user manager where email is the unique identifiers for authentication."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email must be set")
        email = self.normalize_email(email)
        
        # Default is_active to False for new users unless specified (e.g. superuser)
        if 'is_active' not in extra_fields:
            extra_fields['is_active'] = False
            
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", CustomUser.Role.ADMIN)
        extra_fields.setdefault("approval_status", CustomUser.ApprovalStatus.APPROVED)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        MANAGER = "MANAGER", "Manager"
        SALES = "SALES", "Sales"

    class ApprovalStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    username = None  # Remove username field
    email = models.EmailField("email address", unique=True)
    role = models.CharField(
        max_length=10, choices=Role.choices, default=Role.SALES
    )
    approval_status = models.CharField(
        max_length=10, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING
    )
    phone = models.CharField(max_length=20, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class AdminProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='admin_profile')
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True, help_text="e.g., IT, Operations, Executive")
    access_level = models.CharField(max_length=50, default='Super Admin')
    can_manage_billing = models.BooleanField(default=True)
    can_manage_users = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Admin Profile: {self.first_name} {self.last_name} ({self.user.email})"


class ManagerProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='manager_profile')
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    region = models.CharField(max_length=100, blank=True, help_text="e.g., North America, EMEA")
    team_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    max_team_size = models.PositiveIntegerField(default=10)
    monthly_target = models.DecimalField(max_digits=12, decimal_places=2, default=50000.00)
    
    def __str__(self):
        return f"Manager Profile: {self.first_name} {self.last_name} ({self.user.email})"


class SalesProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='sales_profile')
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    manager = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_sales_profiles', limit_choices_to={'role': CustomUser.Role.MANAGER})
    territory = models.CharField(max_length=100, blank=True, help_text="e.g., West Coast, New York")
    target_quota = models.DecimalField(max_digits=12, decimal_places=2, default=10000.00)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00, help_text="Percentage")
    
    def __str__(self):
        return f"Sales Profile: {self.first_name} {self.last_name} ({self.user.email})"


# Signal to create profile automatically when a user is created
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == CustomUser.Role.ADMIN:
            AdminProfile.objects.create(user=instance)
        elif instance.role == CustomUser.Role.MANAGER:
            ManagerProfile.objects.create(user=instance)
        elif instance.role == CustomUser.Role.SALES:
            SalesProfile.objects.create(user=instance)

@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'admin_profile'):
        instance.admin_profile.save()
    elif hasattr(instance, 'manager_profile'):
        instance.manager_profile.save()
    elif hasattr(instance, 'sales_profile'):
        instance.sales_profile.save()
