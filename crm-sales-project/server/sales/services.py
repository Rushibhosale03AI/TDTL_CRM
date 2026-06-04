import pandas as pd
import re
import logging
from typing import Dict, Any, Tuple
from django.db import transaction
from django.utils import timezone
from .models import Lead, Contact, ImportJob
from .notifications import create_notification

logger = logging.getLogger(__name__)

EMAIL_REGEX = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

def sanitize_email(val: str, fallback_index, timestamp) -> str | None:
    """Return a valid email string. If val is not a proper email, return None."""
    if val and EMAIL_REGEX.match(val):
        return val.lower().strip()
    return None

def process_lead_import(import_job: ImportJob, file_obj) -> None:
    """
    Processes an Excel file, creates/updates Lead and Contact records,
    detects daily changes/additions, and notifies relevant Sales, Manager, and Admin roles.
    """
    import_job.status = ImportJob.StatusChoices.PROCESSING
    import_job.save()

    try:
        # Require openpyxl
        df = pd.read_excel(file_obj, engine="openpyxl")
        df = df.fillna("")  # Replace NaNs with empty string
    except Exception as e:
        import_job.status = ImportJob.StatusChoices.FAILED
        import_job.summary = {"error": f"Failed to read file: {str(e)}"}
        import_job.save()
        return

    success_count = 0
    failure_count = 0
    skipped_count = 0
    created_count = 0
    updated_count = 0
    duplicate_count = 0
    errors = []

    # Track changes during import
    newly_added_leads = []
    modified_leads = []

    # Field mapping aliases matching company spreadsheet columns
    FIELD_ALIASES = {
        'name': ['contact name', 'name', 'full name', 'lead name', 'client'],
        'company': ['company name', 'company', 'organization', 'org'],
        'email': ['email address', 'email', 'e-mail'],
        'phone': ['contact no', 'phone', 'contact', 'mobile', 'tel', 'phone number', 'contact number'],
        'designation': ['designation', 'role', 'title', 'job title'],
        'industry': ['industry', 'sector', 'business'],
        'location': ['location', 'city', 'address'],
        'linkedin_url': ['linkedin connect', 'linkedin', 'linkedin url', 'linkedin profile'],
        'status': ['status (completed / rescheduled / no show)', 'status'],
        'value': ['value', 'est value', 'deal value', 'amount']
    }

    # Prefetch existing records to run extremely fast on thousands of rows
    email_col = None
    phone_col = None
    for col in df.columns:
        col_lower = str(col).lower().strip()
        if col_lower in FIELD_ALIASES['email']:
            email_col = col
        if col_lower in FIELD_ALIASES['phone']:
            phone_col = col

    emails_in_sheet = []
    phones_in_sheet = []
    if email_col:
        emails_in_sheet = [str(val).strip() for val in df[email_col].dropna().unique() if str(val).strip()]
    if phone_col:
        phones_in_sheet = [str(val).strip() for val in df[phone_col].dropna().unique() if str(val).strip()]

    existing_leads_by_email = {}
    existing_leads_by_phone = {}
    if emails_in_sheet:
        existing_leads_by_email = {l.email.lower().strip(): l for l in Lead.objects.filter(email__in=emails_in_sheet, is_deleted=False).select_related("owner")}
    if phones_in_sheet:
        existing_leads_by_phone = {l.phone.strip(): l for l in Lead.objects.filter(phone__in=phones_in_sheet, is_deleted=False).select_related("owner") if l.phone}

    for index, row in df.iterrows():
        row_num = index + 2
        try:
            # Smart data extraction
            extracted_data = {}
            unmapped_data = {}
            
            # 1. Identify which Excel columns map to our core fields
            used_columns = set()
            for field, aliases in FIELD_ALIASES.items():
                match = None
                for col in df.columns:
                    if col.lower().strip() in aliases:
                        match = col
                        break
                if match:
                    extracted_data[field] = str(row[match]).strip()
                    used_columns.add(match)
                else:
                    extracted_data[field] = None
 
            # 2. Collect everything else into unmapped_data
            for col in df.columns:
                if col not in used_columns:
                    # Only add if there's actually a value
                    val = str(row[col]).strip()
                    if val and val != "nan":
                        unmapped_data[col] = val

            # Skip completely empty rows (no name AND no email)
            name_raw = (extracted_data.get("name") or "").strip()
            email_raw = (extracted_data.get("email") or "").strip()
            if not name_raw and not email_raw:
                skipped_count += 1
                continue

            with transaction.atomic():
                name_val = name_raw or "Unnamed Import"
                phone_val = (extracted_data.get("phone") or "").strip() or None

                # Sanitize email — if the cell value isn't a valid email, generate a safe placeholder
                raw_email = email_raw
                safe_email = sanitize_email(raw_email, index, timezone.now().timestamp())
                # Use the original email (if valid) for dedup lookup, else None
                valid_email_for_lookup = raw_email.lower().strip() if raw_email and EMAIL_REGEX.match(raw_email) else None

                # Check bulk prefetched lead maps for high speed and duplicate prevention
                existing_lead = None
                if valid_email_for_lookup:
                    existing_lead = existing_leads_by_email.get(valid_email_for_lookup)
                if not existing_lead and name_val and phone_val:
                    existing_lead = existing_leads_by_phone.get(phone_val.strip())

                logger.info(f"Row {row_num}: name={name_val!r}, email={raw_email!r}, safe_email={safe_email!r}, existing={existing_lead is not None}")

                lead_defaults = {
                    "name": name_val,
                    "phone": phone_val,
                    "designation": (extracted_data.get("designation") or "").strip() or None,
                    "industry": (extracted_data.get("industry") or "").strip() or None,
                    "location": (extracted_data.get("location") or "").strip() or None,
                    "linkedin_url": (extracted_data.get("linkedin_url") or "").strip() or None,
                    "company": (extracted_data.get("company") or "").strip() or None,
                    "custom_fields": unmapped_data,
                    "owner": import_job.uploaded_by,
                    "created_by": import_job.uploaded_by,
                    "status": (extracted_data.get("status") or "").strip() or "Yet to approach",
                    "source": "Excel Import"
                }

                if existing_lead:
                    duplicate_count += 1
                    changes = []
                    # Compare and update core fields only if new non-empty values are imported
                    if name_val and name_val.strip() and existing_lead.name != name_val.strip():
                        changes.append(f"Name: '{existing_lead.name}' ➡️ '{name_val}'")
                        existing_lead.name = name_val.strip()
                        
                    if extracted_data.get("company") and extracted_data.get("company").strip() and existing_lead.company != extracted_data.get("company").strip():
                        changes.append(f"Company: '{existing_lead.company}' ➡️ '{extracted_data.get('company')}'")
                        existing_lead.company = extracted_data.get("company").strip()
                        
                    if phone_val and phone_val.strip() and existing_lead.phone != phone_val.strip():
                        changes.append(f"Contact No: '{existing_lead.phone}' ➡️ '{phone_val}'")
                        existing_lead.phone = phone_val.strip()
                        
                    if extracted_data.get("designation") and extracted_data.get("designation").strip() and existing_lead.designation != extracted_data.get("designation").strip():
                        changes.append(f"Designation: '{existing_lead.designation}' ➡️ '{extracted_data.get('designation')}'")
                        existing_lead.designation = extracted_data.get("designation").strip()

                    if extracted_data.get("industry") and extracted_data.get("industry").strip() and existing_lead.industry != extracted_data.get("industry").strip():
                        existing_lead.industry = extracted_data.get("industry").strip()

                    if extracted_data.get("location") and extracted_data.get("location").strip() and existing_lead.location != extracted_data.get("location").strip():
                        existing_lead.location = extracted_data.get("location").strip()

                    if extracted_data.get("linkedin_url") and extracted_data.get("linkedin_url").strip() and existing_lead.linkedin_url != extracted_data.get("linkedin_url").strip():
                        changes.append(f"Linkedin Connect: '{existing_lead.linkedin_url}' ➡️ '{extracted_data.get('linkedin_url')}'")
                        existing_lead.linkedin_url = extracted_data.get("linkedin_url").strip()
                    
                    status_val = extracted_data.get("status")
                    if status_val and status_val.strip() and existing_lead.status != status_val.strip():
                        changes.append(f"Status: '{existing_lead.status}' ➡️ '{status_val}'")
                        existing_lead.status = status_val.strip()
                    
                    # Smart Non-Destructive custom_fields Merging
                    merged_custom = dict(existing_lead.custom_fields or {})
                    for k, v in unmapped_data.items():
                        if v and str(v).strip() and str(v).strip().lower() != "nan":
                            old_v = merged_custom.get(k)
                            if str(old_v).strip() != str(v).strip():
                                changes.append(f"{k}: '{old_v or 'None'}' ➡️ '{v}'")
                                merged_custom[k] = str(v).strip()
                    
                    existing_lead.custom_fields = merged_custom

                    # Record tracking
                    existing_lead.imported_at = timezone.now()
                    existing_lead.imported_by = import_job.uploaded_by

                    if changes:
                        updated_count += 1
                        modified_leads.append(f"• **{existing_lead.name}**: {', '.join(changes)}")

                    existing_lead.save()
                    lead = existing_lead
                else:
                    lead = Lead.objects.create(
                        email=safe_email,
                        imported_at=timezone.now(),
                        imported_by=import_job.uploaded_by,
                        **lead_defaults
                    )
                    created_count += 1
                    logger.info(f"Row {row_num}: CREATED new lead id={lead.id} name={lead.name!r}")
                    newly_added_leads.append(f"• **{lead.name}** ({lead.company or 'No Company'})")

                # Sync with Contact record — always use lead.email (which is the sanitized value)
                Contact.objects.update_or_create(
                    email=lead.email,
                    defaults={
                        "lead": lead,
                        "name": lead.name,
                        "phone": lead.phone or "",
                        "company": lead.company or "",
                        "designation": lead.designation or "",
                        "location": lead.location or "",
                        "industry": lead.industry or "",
                        "linkedin_url": lead.linkedin_url or "",
                        "custom_fields": lead.custom_fields,
                        "owner": lead.owner
                    }
                )
                
                success_count += 1
        except Exception as e:
            failure_count += 1
            errors.append({"row": row_num, "message": str(e)})

    # Finalize import status
    import_job.status = ImportJob.StatusChoices.COMPLETED
    import_job.summary = {
        "total": success_count + failure_count,
        "success_count": success_count,
        "failure_count": failure_count,
        "skipped_count": skipped_count,
        "created_count": created_count,
        "updated_count": updated_count,
        "duplicate_count": duplicate_count,
        "errors": errors
    }
    logger.info(f"Import job {import_job.id} DONE: created={created_count}, updated={updated_count}, duplicates={duplicate_count}, skipped={skipped_count}, failed={failure_count}")
    import_job.save()

    # ──────────────────────────────────────────
    # Generate Audit Trail & Notification Reminders
    # ──────────────────────────────────────────
    if newly_added_leads or modified_leads:
        user_name = import_job.uploaded_by.get_full_name() or import_job.uploaded_by.email
        
        msg = f"📋 **Daily Excel Import Summary** (Imported by: {user_name})\n"
        if newly_added_leads:
            msg += f"\n🆕 **Newly Added Leads ({len(newly_added_leads)})**:\n" + "\n".join(newly_added_leads[:15])
            if len(newly_added_leads) > 15:
                msg += f"\n...and {len(newly_added_leads) - 15} more new leads."
        if modified_leads:
            msg += f"\n\n🔄 **Changes Made / Updated ({len(modified_leads)})**:\n" + "\n".join(modified_leads[:15])
            if len(modified_leads) > 15:
                msg += f"\n...and {len(modified_leads) - 15} more updates."

        # Compile distinct roles to notify: Importer, Managers, and Admins
        from django.contrib.auth import get_user_model
        User = get_user_model()
        recipients = set()
        recipients.add(import_job.uploaded_by)  # Sales person

        # Team managers
        team_managers = User.objects.filter(created_teams__members=import_job.uploaded_by).distinct()
        for manager in team_managers:
            recipients.add(manager)

        # Admins
        admins = User.objects.filter(role="ADMIN")
        for admin in admins:
            recipients.add(admin)

        # Create notifications
        for recipient in recipients:
            create_notification(recipient, msg)
