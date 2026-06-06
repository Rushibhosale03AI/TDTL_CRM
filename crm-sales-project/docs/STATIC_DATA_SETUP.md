# Static Data Setup Guide

This guide explains how to populate your CRM with static demo data for testing and development.

## Overview

The application now includes:
- **Backend Seeding**: Django management command to populate database with realistic demo data
- **Frontend Mock Data**: Fallback mock data in hooks for when backend is unavailable
- **Interactive Features**: Full functionality enabled across all components

## Backend Setup

### 1. Run Database Migrations

First, ensure your database is up to date:

```bash
cd server
python manage.py migrate
```

### 2. Seed Demo Data

Run the seed data management command:

```bash
python manage.py seed_data
```

This creates:
- **1 Admin User**: admin@tdtl.com (password: admin123)
- **2 Manager Users**: supriya@tdtl.com, rahul@tdtl.com (password: manager123)
- **4 Sales Representatives**: priya@tdtl.com, ashwini@tdtl.com, rajesh@tdtl.com, neha@tdtl.com (password: sales123)
- **2 Teams**: South India Sales Team, North India Sales Team
- **4 Leads**: Various companies and statuses
- **3 Contacts**: Associated with leads
- **4 Deals**: Different stages from prospecting to closed won
- **4 Activities**: Call logs, emails, meetings
- **4 Tasks**: Various priorities and completion statuses
- **3 Evening Reports**: Team daily reports with productivity metrics
- **Notifications & Activity Logs**: For full feature testing

## Frontend Mock Data

All hooks include fallback mock data. If the backend API is unavailable:
- The application automatically falls back to realistic mock data
- All interactive features work without any modifications
- Data is consistent across all views

### Updated Hooks with Mock Data:

1. **useDashboard** - Mock admin/manager/sales dashboard data
2. **useLeads** - 4 sample leads with complete information
3. **useDeals** - 4 sample deals at different pipeline stages
4. **useTasks** - 4 sample tasks with different priorities
5. **useContacts** - 3 sample contacts with company information
6. **useTeams** - 2 sample teams with members

## Test Credentials

### Admin User
- Email: admin@tdtl.com
- Password: admin123
- Access: Full system access, global reporting

### Manager Users
```
Email: supriya@tdtl.com          Email: rahul@tdtl.com
Password: manager123              Password: manager123
Region: India - South             Region: India - North
Team: 2 members                    Team: 2 members
```

### Sales Representatives
```
Email: priya@tdtl.com             Email: ashwini@tdtl.com
Password: sales123                 Password: sales123
Manager: Supriya Sharma            Manager: Supriya Sharma
Territory: Bangalore               Territory: Chennai
```

```
Email: rajesh@tdtl.com            Email: neha@tdtl.com
Password: sales123                 Password: sales123
Manager: Rahul Kumar               Manager: Rahul Kumar
Territory: Delhi                   Territory: Mumbai
```

## Features Available with Static Data

### 1. Dashboard
- Admin dashboard with global revenue metrics
- Manager dashboard with team performance analytics
- Sales dashboard with personal metrics
- Interactive KPI cards with trends

### 2. Leads Management
- Full lead list with filtering and sorting
- Company and contact information
- Lead scoring system (0-100)
- Lead status tracking

### 3. Deals Pipeline
- Kanban board with deal stages
- Deal amount and probability tracking
- Close date visualization
- Pipeline analytics

### 4. Tasks Management
- Task assignment by priority
- Progress tracking
- Completion status updates
- Due date management

### 5. Team Performance
- **Sortable table** - Sort by Revenue, Deals, Target %
- **Filterable status** - Active, Pending, All
- **Expandable rows** - View detailed team member info
- **Performance metrics** - Revenue, deals closed, target progress

### 6. Contacts Management
- Contact list with company associations
- Contact history and interactions
- Multi-company support

### 7. Evening Reports
- Daily EOD report submission
- Productivity scoring
- Manager remarks and approvals
- Team aggregated analytics

## Interactive Features Demo

### Team Performance (Fully Working)
1. Sort team members by Revenue/Deals/Target %
2. Filter by Active/Pending status
3. Expand rows to see detailed information
4. View manager, contact, team, and last update info

### Dashboard
1. View KPI cards with trends
2. See monthly revenue trends
3. View top performers rankings
4. Check task completion rates

### Pipeline
1. View deals by stage
2. Drag and drop (if supported)
3. Check deal probabilities
4. View deal amounts

## Running the Application

### Development Server

```bash
# Terminal 1 - Backend
cd server
python manage.py runserver

# Terminal 2 - Frontend
cd client
npm run dev
```

### Docker Compose (If Available)

```bash
docker-compose up
```

## API Endpoints with Static Data

All API endpoints work with the seeded data:

- `GET /api/dashboard/admin/` - Admin dashboard
- `GET /api/dashboard/manager/` - Manager dashboard
- `GET /api/dashboard/sales/` - Sales dashboard
- `GET /api/leads/` - List all leads
- `GET /api/deals/` - List all deals
- `GET /api/tasks/` - List all tasks
- `GET /api/contacts/` - List all contacts
- `GET /api/teams/` - List all teams
- `GET /api/eod/` - Evening reports

## Troubleshooting

### Backend Issues

**Error: "No such table"**
- Solution: Run migrations first
  ```bash
  python manage.py migrate
  ```

**Error: "Auth user model not found"**
- Solution: Ensure INSTALLED_APPS includes 'accounts' and 'sales'

**Error: "seed_data command not found"**
- Solution: Verify management/commands directory exists and __init__.py files are present

### Frontend Issues

**No data showing**
- Check browser console for errors
- Verify API base URL in environment variables
- Check mock data is being used (console should show "Using mock X data")

**Mock data not displaying**
- Clear browser cache and localStorage
- Refresh the page
- Check that hooks are properly imported

## Resetting Data

To reset all data and start fresh:

```bash
# Option 1: Delete specific data
python manage.py shell
>>> from sales.models import Lead, Deal, Task
>>> Lead.objects.all().delete()
>>> Deal.objects.all().delete()
>>> Task.objects.all().delete()

# Option 2: Flush all data
python manage.py flush

# Option 3: Delete and recreate database
# Delete db.sqlite3 file, then:
python manage.py migrate
python manage.py seed_data
```

## Customizing Mock Data

To add or modify mock data:

1. **Backend**: Edit `server/sales/seed_data.py`
2. **Frontend**: Edit individual hook files in `client/src/hooks/`

For example, to add a new lead:

```python
# In seed_data.py
leads_data.append({
    'name': 'Your Company Name',
    'company': 'Your Company',
    'email': 'contact@yourcompany.com',
    'phone': '+91-XXXXX-XXXXX',
    'designation': 'Your Designation',
    'industry': 'Your Industry',
    'location': 'Your Location',
    'source': 'Your Source',
    'status': 'Yet to approach',
    'value': Decimal('50000.00'),
    'owner': sales_reps[0],
})
```

## Next Steps

1. Review and test all interactive features
2. Customize the static data for your use case
3. Set up real database connections when ready
4. Implement API endpoints if not already done
5. Deploy to production

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Review the models in `server/sales/models.py`
3. Check the hook implementations in `client/src/hooks/`
4. Refer to the main README.md for general setup
