import pandas as pd
from django.db import transaction
from .models import Lead, Contact

def process_excel_import(file_path, user):
    """
    Processes an Excel file and imports data into the Lead and Contact tables.
    Expected columns: name, designation, contact, email, industry, location, linkedin
    """
    try:
        # Read the excel file
        df = pd.read_excel(file_path)
        
        # Standardize column names (lowercase and strip spaces)
        df.columns = [str(c).lower().strip() for c in df.columns]
        
        # Required mapping
        # Excel: name, designation, contact, email, industry, location, linkedin
        # DB: name, designation, phone, email, industry, location, linkedin_url
        
        column_mapping = {
            'contact': 'phone',
            'linkedin': 'linkedin_url'
        }
        
        df = df.rename(columns=column_mapping)
        
        success_count = 0
        errors = []
        
        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    # Skip rows without a name or email
                    if pd.isna(row.get('name')) or pd.isna(row.get('email')):
                        continue
                        
                    email = str(row.get('email')).strip()
                    name = str(row.get('name')).strip()
                    
                    # Create or Update Lead
                    lead, created = Lead.objects.update_or_create(
                        email=email,
                        defaults={
                            'name': name,
                            'company': str(row.get('company', '')),
                            'phone': str(row.get('phone', '')),
                            'designation': str(row.get('designation', '')),
                            'location': str(row.get('location', '')),
                            'linkedin_url': str(row.get('linkedin_url', '')),
                            'industry': str(row.get('industry', '')),
                            'owner': user,
                            'created_by': user,
                            'status': Lead.StatusChoices.NEW
                        }
                    )
                    
                    # Also create a linked Contact for easy reference
                    Contact.objects.update_or_create(
                        email=email,
                        defaults={
                            'lead': lead,
                            'name': name,
                            'phone': str(row.get('phone', '')),
                            'industry': str(row.get('industry', '')),
                            'designation': str(row.get('designation', '')),
                            'location': str(row.get('location', '')),
                            'linkedin_url': str(row.get('linkedin_url', '')),
                            'owner': user
                        }
                    )
                    
                    success_count += 1
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")
                    
        return {
            'success': True,
            'count': success_count,
            'errors': errors
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
