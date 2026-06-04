"""
Custom DRF exception handler — returns consistent JSON error responses.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to produce uniform error envelopes:
    {
        "error": true,
        "message": "...",
        "details": { ... }  // per-field errors when applicable
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "error": True,
            "message": _get_message(response),
            "details": response.data if isinstance(response.data, dict) else {"non_field_errors": response.data},
        }
        response.data = error_data
        return response

    # Unhandled exceptions → 500
    return Response(
        {
            "error": True,
            "message": "An unexpected error occurred.",
            "details": {},
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _get_message(response):
    """Extract a human-readable top-level message from a DRF error response."""
    if isinstance(response.data, dict):
        detail = response.data.get("detail")
        if detail:
            return str(detail)
        # Flatten first field error
        for _field, errors in response.data.items():
            if isinstance(errors, list) and errors:
                return str(errors[0])
            return str(errors)
    if isinstance(response.data, list) and response.data:
        return str(response.data[0])
    return "Validation error."
