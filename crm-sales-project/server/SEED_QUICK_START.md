# Quick Start - Seed Data

## One-Command Setup

Run this to populate the entire database with demo data:

```bash
python manage.py seed_data
```

## What Gets Created

✓ 1 Admin + 2 Managers + 4 Sales Reps  
✓ 2 Teams with full member assignments  
✓ 4 Leads with complete company info  
✓ 3 Contacts linked to leads  
✓ 4 Deals at different pipeline stages  
✓ 4 Activities (calls, emails, meetings)  
✓ 4 Tasks with priority levels  
✓ 3 Evening Reports  
✓ Notifications and Activity Logs  

## Login Credentials

**Admin:**
- Email: admin@tdtl.com
- Password: admin123

**Managers:**
- supriya@tdtl.com / manager123
- rahul@tdtl.com / manager123

**Sales Reps:**
- priya@tdtl.com / sales123
- ashwini@tdtl.com / sales123
- rajesh@tdtl.com / sales123
- neha@tdtl.com / sales123

## Test It Out

1. Start the server:
   ```bash
   python manage.py runserver
   ```

2. Open frontend in another terminal:
   ```bash
   cd ../client
   npm run dev
   ```

3. Login and explore all features - they all work with static data!

## Key Features to Test

- ✓ Team Performance sorting & filtering
- ✓ Dashboard metrics & charts
- ✓ Leads and deals management
- ✓ Task assignment and tracking
- ✓ Evening report submission
- ✓ Team analytics

Enjoy! 🚀
