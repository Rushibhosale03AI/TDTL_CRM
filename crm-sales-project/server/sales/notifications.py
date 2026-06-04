from .models import ActivityLog, Notification


def create_activity_log(user, action, module, ip_address=None):
    return ActivityLog.objects.create(
        user=user,
        action=action,
        module=module,
        ip_address=ip_address,
    )


def create_notification(user, message):
    return Notification.objects.create(
        user=user,
        message=message,
    )
