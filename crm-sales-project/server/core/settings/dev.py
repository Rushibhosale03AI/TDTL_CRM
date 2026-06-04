"""
Development settings — extends base.py.
"""

from .base import *  # noqa: F401,F403

DEBUG = True

# Allow all hosts in development
ALLOWED_HOSTS = ["*"]

# Allow all CORS origins in development to accommodate shifting port configurations (e.g. port 5175)
CORS_ALLOW_ALL_ORIGINS = True

# Use console email backend for dev
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
