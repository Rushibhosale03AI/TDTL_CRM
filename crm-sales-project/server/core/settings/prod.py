"""
Production settings — extends base.py.
"""

from .base import *  # noqa: F401,F403
import os

DEBUG = False

# Prepend WhiteNoise middleware for static file serving in simple deployments
# This will insert the middleware at runtime without modifying base.py
MIDDLEWARE = [
	"whitenoise.middleware.WhiteNoiseMiddleware",
] + MIDDLEWARE

# Use compressed manifest static files storage for cache-friendly static files
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Security hardening
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# When behind a proxy/load-balancer, set this to ensure correct request.is_secure().
# Configure your proxy to forward the X-Forwarded-Proto header and set this value.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# CSRF trusted origins — set as comma-separated env var, e.g. https://example.com
CSRF_TRUSTED_ORIGINS = [h for h in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if h]

