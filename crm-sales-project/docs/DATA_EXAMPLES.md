# Static Data Examples

Complete examples of all data structures used in the application.

## User Data

### Admin User
```json
{
  "id": 1,
  "email": "admin@tdtl.com",
  "first_name": "Admin",
  "last_name": "User",
  "role": "ADMIN",
  "approval_status": "APPROVED",
  "is_active": true,
  "is_staff": true,
  "phone": "+1-800-ADMIN",
  "admin_profile": {
    "department": "Executive",
    "access_level": "Super Admin",
    "can_manage_billing": true,
    "can_manage_users": true
  }
}
```

### Manager User
```json
{
  "id": 2,
  "email": "supriya@tdtl.com",
  "first_name": "Supriya",
  "last_name": "Sharma",
  "role": "MANAGER",
  "approval_status": "APPROVED",
  "is_active": true,
  "phone": "+1-555-0101",
  "manager_profile": {
    "phone_number": "+1-555-0101",
    "region": "India - South",
    "team_budget": 500000.00,
    "monthly_target": 100000.00,
    "max_team_size": 10
  }
}
```

### Sales Rep User
```json
{
  "id": 3,
  "email": "priya@tdtl.com",
  "first_name": "Priya",
  "last_name": "Singh",
  "role": "SALES",
  "approval_status": "APPROVED",
  "is_active": true,
  "phone": "+1-555-0201",
  "sales_profile": {
    "manager": 2,
    "territory": "Bangalore",
    "target_quota": 25000.00,
    "commission_rate": 5.00
  }
}
```

## Lead Data

```json
{
  "id": 1,
  "name": "priya - TechInfo Tech",
  "company": "TechInfo Tech",
  "email": "contact@techinfo.com",
  "phone": "+91-90000-00001",
  "designation": "CTO",
  "industry": "Information Technology",
  "location": "Bangalore",
  "source": "Linkedin",
  "status": "Yet to approach",
  "value": 50000.00,
  "converted": false,
  "score": 65,
  "owner": 3,
  "created_by": 3,
  "created_at": "2024-06-03T10:00:00Z",
  "is_deleted": false
}
```

## Contact Data

```json
{
  "id": 1,
  "name": "John Smith",
  "email": "john.smith@techinfo.com",
  "phone": "+91-90000-10001",
  "company": "TechInfo Tech",
  "industry": "IT",
  "designation": "Project Manager",
  "location": "Bangalore",
  "linkedin_url": "https://linkedin.com/in/johnsmith",
  "lead": 1,
  "owner": 3,
  "last_contacted": "2024-06-03T09:30:00Z",
  "created_at": "2024-06-03T10:00:00Z"
}
```

## Deal Data

```json
{
  "id": 1,
  "name": "TechInfo - Enterprise Solution",
  "stage": "PROPOSAL",
  "amount": 50000.00,
  "probability": 60,
  "close_date": "2024-07-03",
  "lead": 1,
  "owner": 3,
  "created_at": "2024-06-03T10:00:00Z",
  "updated_at": "2024-06-03T10:00:00Z",
  "is_deleted": false
}
```

Deal Stages:
- `PROSPECTING` - Initial exploration
- `PROPOSAL` - Proposal sent
- `NEGOTIATION` - Negotiating terms
- `CLOSED_WON` - Deal closed
- `CLOSED_LOST` - Deal lost

## Task Data

```json
{
  "id": 1,
  "title": "Follow up with TechInfo",
  "description": "Check on proposal status",
  "assigned_to": 3,
  "due_date": "2024-06-05T23:59:59Z",
  "estimated_hours": 2.5,
  "is_completed": false,
  "priority": "HIGH",
  "status": "in_progress",
  "progress_percentage": 50,
  "lead": 1,
  "deal": null,
  "created_at": "2024-06-03T10:00:00Z",
  "updated_at": "2024-06-03T10:00:00Z"
}
```

Task Priority Levels:
- `LOW` - Can wait
- `MEDIUM` - Normal priority
- `HIGH` - Important
- `URGENT` - Immediate action

Task Status:
- `todo` - Not started
- `in_progress` - Currently working
- `completed` - Finished

## Activity Data

```json
{
  "id": 1,
  "type": "CALL",
  "content": "Initial call with TechInfo to discuss requirements",
  "user": 3,
  "lead": 1,
  "deal": null,
  "timestamp": "2024-06-03T10:30:00Z"
}
```

Activity Types:
- `NOTE` - Internal note
- `CALL` - Phone call
- `EMAIL` - Email communication
- `MEETING` - In-person/video meeting

## Team Data

```json
{
  "id": 1,
  "name": "South India Sales Team",
  "manager": 2,
  "members": [3, 4],
  "created_by": 2,
  "created_at": "2024-06-03T10:00:00Z"
}
```

## Evening Report Data

```json
{
  "id": 1,
  "employee": 3,
  "manager": 2,
  "report_date": "2024-06-03",
  "calls_done": 5,
  "emails_sent": 8,
  "followups_done": 3,
  "meetings_fixed": 2,
  "meetings_fixed_details": "Meeting with TechInfo on Monday, New Company on Wednesday",
  "meetings_attended": 1,
  "meetings_attended_details": "Demo presentation to existing client",
  "leads_generated": 2,
  "linkedin_outreach": 15,
  "demos_given": 1,
  "key_highlights": "Closed deal with TDTL worth ₹75k, strong pipeline built",
  "tomorrow_plan": "Follow up on pending proposals, attend sales meeting",
  "challenges_faced": "Client delayed response, need to reschedule meeting",
  "manager_remarks": "Good performance",
  "productivity_score": 85,
  "submission_status": "SUBMITTED",
  "submitted_at": "2024-06-03T18:00:00Z",
  "approved_at": null,
  "created_at": "2024-06-03T10:00:00Z"
}
```

Evening Report Status:
- `SUBMITTED` - Awaiting manager review
- `APPROVED` - Approved by manager
- `REJECTED` - Rejected by manager
- `LATE_SUBMISSION` - Submitted after deadline

## Activity Log Data

```json
{
  "id": 1,
  "user": 3,
  "action": "Created new lead",
  "module": "Leads",
  "ip_address": "192.168.1.100",
  "timestamp": "2024-06-03T10:15:00Z"
}
```

Module Types:
- `Leads` - Lead management
- `Deals` - Deal pipeline
- `Tasks` - Task management
- `Contacts` - Contact management
- `Teams` - Team management
- `Reports` - Evening reports
- `Dashboard` - Dashboard views

## Notification Data

```json
{
  "id": 1,
  "user": 3,
  "message": "Your proposal for TechInfo has been viewed",
  "read": false,
  "created_at": "2024-06-03T10:20:00Z"
}
```

## Dashboard Data (Mock)

### Admin Dashboard
```json
{
  "overview": {
    "totalManagers": 2,
    "totalGlobalRevenue": "₹225000",
    "totalSalesReps": 4
  },
  "managers": [
    {
      "id": 2,
      "name": "Supriya Sharma",
      "region": "India - South",
      "teamSize": 2,
      "revenue": "₹125000",
      "performance": "+25%"
    },
    {
      "id": 5,
      "name": "Rahul Kumar",
      "region": "India - North",
      "teamSize": 2,
      "revenue": "₹100000",
      "performance": "+15%"
    }
  ],
  "revenueData": [
    { "name": "Mar", "revenue": 45000, "target": 50000 },
    { "name": "Apr", "revenue": 62000, "target": 50000 },
    { "name": "May", "revenue": 58000, "target": 50000 },
    { "name": "Jun", "revenue": 60000, "target": 50000 }
  ]
}
```

### Manager Dashboard
```json
{
  "overview": {
    "totalTeamRevenue": "₹125000",
    "activeReps": 2,
    "totalTeamLeads": 12,
    "teamAttainment": 65,
    "taskCompletionRate": 75
  },
  "teamPerformance": [
    {
      "id": 3,
      "name": "Priya Singh",
      "email": "priya@tdtl.com",
      "dealsClosed": 3,
      "revenue": "₹75000",
      "targetProgress": 75,
      "manager": { "id": 2, "name": "Supriya Sharma" },
      "team": "South India Sales Team",
      "lastUpdate": "2 hours ago"
    }
  ],
  "revenueData": [
    { "name": "Mar", "revenue": 35000, "target": 30000 },
    { "name": "Apr", "revenue": 42000, "target": 30000 },
    { "name": "May", "revenue": 48000, "target": 30000 },
    { "name": "Jun", "revenue": 50000, "target": 30000 }
  ]
}
```

### Sales Dashboard
```json
{
  "overview": {
    "totalRevenue": "₹75000",
    "activeLeads": 12,
    "totalDeals": 3,
    "conversionRate": 25,
    "taskCompletionRate": 60
  },
  "revenueData": [
    { "name": "Mar", "revenue": 20000, "target": 20000 },
    { "name": "Apr", "revenue": 25000, "target": 20000 },
    { "name": "May", "revenue": 22000, "target": 20000 },
    { "name": "Jun", "revenue": 25000, "target": 20000 }
  ],
  "tasks": [
    {
      "id": 1,
      "title": "Follow up with TechInfo",
      "status": "In Progress",
      "priority": "High",
      "dueDate": "2024-06-05"
    }
  ]
}
```

## Data Relationships

```
User (Admin/Manager/Sales)
├── Admin Profile
├── Manager Profile (if manager)
│   └── Team
│       └── Team Members (Sales Users)
└── Sales Profile (if sales rep)
    ├── Manager (if assigned)
    ├── Leads (owner)
    ├── Deals (owner)
    ├── Tasks (assigned_to)
    ├── Activities (user)
    └── Evening Reports (employee)

Lead
├── Owner (User)
├── Contacts (multiple)
├── Deals (multiple)
├── Activities (multiple)
├── Tasks (multiple)
└── Documents (multiple)

Deal
├── Lead
├── Owner (User)
├── Activities (multiple)
└── Tasks (multiple)

Task
├── Assigned To (User)
├── Lead (optional)
└── Deal (optional)

Evening Report
├── Employee (User)
└── Manager (User)
```

## Sample Data Statistics

| Entity | Count | Status |
|--------|-------|--------|
| Users | 7 | Ready |
| Teams | 2 | Ready |
| Leads | 5 | Ready |
| Contacts | 3 | Ready |
| Deals | 4 | Ready |
| Tasks | 4 | Ready |
| Activities | 4 | Ready |
| Evening Reports | 3 | Ready |
| Notifications | 4 | Ready |
| Activity Logs | 3 | Ready |

Total seeded data: **40+ records** across all entity types

## Accessing the Data

### Via Backend API
```bash
# Get all leads
GET /api/leads/

# Get specific lead
GET /api/leads/1/

# Get all deals
GET /api/deals/

# Get dashboard data
GET /api/dashboard/manager/
```

### Via Frontend Hooks
```javascript
// In React component
const { leads } = useLeads()
const { deals } = useDeals()
const { tasks } = useTasks()
const { data: dashboard } = useDashboard()
```

### Via Django Shell
```bash
python manage.py shell
>>> from sales.models import Lead, Deal, Task
>>> Lead.objects.all()
>>> Deal.objects.filter(stage='CLOSED_WON')
>>> Task.objects.filter(priority='HIGH')
```

## Notes

- All currency values are in INR (₹)
- All timestamps are in ISO 8601 format
- All IDs are auto-incrementing integers
- Foreign keys are represented as references or nested objects
- Dates are in YYYY-MM-DD format
- All mock data is consistent across frontend and backend
