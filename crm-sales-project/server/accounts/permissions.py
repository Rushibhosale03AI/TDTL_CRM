from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """Allows access only to Admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "ADMIN")

class IsManagerRole(permissions.BasePermission):
    """Allows access only to Manager users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "MANAGER")

class IsSalesRole(permissions.BasePermission):
    """Allows access only to Sales users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "SALES")

class IsManagerOrAdmin(permissions.BasePermission):
    """Allows access to Managers and Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            request.user.role in ["ADMIN", "MANAGER"]
        )
