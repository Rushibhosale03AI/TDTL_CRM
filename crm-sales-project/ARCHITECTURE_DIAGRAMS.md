# TDTL CRM - Architecture & Flow Diagrams

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        END USERS                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Admin User  │  │ Manager User │  │  Sales Reps  │            │
│  │  (Full Access)│  │(Team Lead)   │  │ (Personal)   │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                  │                    │
└─────────┼─────────────────┼──────────────────┼────────────────────┘
          │                 │                  │
          └─────────────────┼──────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │   HTTPS / REST    │
                  │   API Gateway     │
                  └─────────┬─────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────▼────────┐ ┌──────▼──────┐ ┌────────▼────────┐
│   FRONTEND      │ │   CACHE     │ │   RATE LIMIT    │
│   React/Vite    │ │   Redis     │ │   Middleware    │
│   localhost:    │ │  (Optional) │ │                 │
│   5175          │ └─────────────┘ └────────┬────────┘
│                 │                          │
│  • Dashboard    │                          │
│  • Leads        │          ┌───────────────▼─────────────┐
│  • Pipeline     │          │   BACKEND (Django/DRF)     │
│  • Contacts     │          │   localhost:8000            │
│  • Team         │          │                             │
│  • Reports      │          │  ┌──────────────────────┐  │
│  • AI Copilot   │          │  │  Authentication      │  │
│                 │          │  │  • JWT Token         │  │
│  Zustand        │          │  │  • User Roles        │  │
│  State Store    │          │  │  • Permissions       │  │
└────────┬────────┘          │  └──────────────────────┘  │
         │                   │                             │
         │                   │  ┌──────────────────────┐  │
         │                   │  │  Sales ViewSets      │  │
         │                   │  │  • LeadViewSet       │  │
         │                   │  │  • DealViewSet       │  │
         │                   │  │  • ContactViewSet    │  │
         │                   │  │  • ActivityViewSet   │  │
         │                   │  │  • TaskViewSet       │  │
         │                   │  └──────────────────────┘  │
         │                   │                             │
         │                   │  ┌──────────────────────┐  │
         │                   │  │  Business Logic      │  │
         │                   │  │  • Serializers       │  │
         │                   │  │  • Services          │  │
         │                   │  │  • Dashboard         │  │
         │                   │  │  • Reports           │  │
         │                   │  │  • Notifications     │  │
         │                   │  └──────────────────────┘  │
         │                   │                             │
         │                   │  ┌──────────────────────┐  │
         │                   │  │  Data Layer          │  │
         │                   │  │  • ORM Models        │  │
         │                   │  │  • Queries           │  │
         │                   │  │  • Signals           │  │
         │                   │  │  • Migrations        │  │
         │                   │  └──────────┬───────────┘  │
         │                   └─────────────┼──────────────┘
         │                                 │
         │                       ┌─────────▼─────────┐
         │                       │   DATABASE        │
         │                       │   MySQL/SQLite    │
         │                       │                   │
         │                       │  Tables:          │
         │                       │  • users          │
         │                       │  • leads          │
         │                       │  • deals          │
         │                       │  • contacts       │
         │                       │  • teams          │
         │                       │  • tasks          │
         │                       │  • activities     │
         │                       │  • evening_       │
         │                       │    reports        │
         │                       │  • notifications  │
         │                       │  • documents      │
         │                       │  • and more...    │
         │                       │                   │
         │                       └───────────────────┘
         │
         └─ Optional: File Storage (S3 / Local)
              └─ Documents, Excel uploads, Exports
```

---

## 2. User Authentication & Authorization Flow

```
START: User visits http://localhost:5175
       │
       ▼
   ┌─────────────────┐
   │ Check localStorage│
   │ for JWT token   │
   └─────┬───────────┘
         │
    ┌────┴─────┐
    │           │
  YES          NO
    │           │
    ▼           ▼
Try use    Redirect to
token      /login page
    │           │
    └───┬───────┘
        │
        ▼
    ┌────────────────────┐
    │ /login page        │
    │ (Email + Password) │
    └─────┬──────────────┘
          │
          ▼
    ┌──────────────────────────────┐
    │ POST /api/auth/login/        │
    │ Body: {email, password}      │
    └──────┬───────────────────────┘
           │
           ▼ (Backend)
    ┌──────────────────────────────┐
    │ 1. Find user by email        │
    │ 2. Verify password (bcrypt)  │
    │ 3. Check approval_status     │
    │    ├─ PENDING? ❌ Reject     │
    │    ├─ REJECTED? ❌ Reject    │
    │    └─ APPROVED? ✅ Continue  │
    │ 4. Generate JWT tokens:      │
    │    ├─ access (15 min)        │
    │    └─ refresh (7 days)       │
    └──────┬───────────────────────┘
           │
    ┌──────┴─────────┐
    │                │
SUCCESS          FAILURE
    │                │
    ▼                ▼
Return JWT        Return 401
tokens            (error msg)
    │                │
    ▼                ▼
Save to        Show error
localStorage   toast &
    │          retry login
    ▼
Redirect to
/dashboard

┌─────────────────────────────────────────────────────────┐
│ JWT Token Structure (Stored in localStorage)            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ access_token (stored in memory or localStorage)         │
│ ├─ Header: {alg: "HS256", typ: "JWT"}                  │
│ ├─ Payload: {user_id, role, exp: timestamp}            │
│ └─ Signature: HMAC(header.payload, SECRET_KEY)         │
│                                                          │
│ Used in: Authorization header on EVERY request         │
│ Expires: 15 minutes                                      │
│                                                          │
│ refresh_token (for getting new access token)           │
│ ├─ Expires: 7 days                                     │
│ └─ Used: When access token expires                     │
│                                                          │
│ Flow when access token expires:                         │
│ 1. API returns 401 Unauthorized                        │
│ 2. Frontend sends refresh_token to /api/token/refresh/ │
│ 3. Backend validates refresh token                     │
│ 4. Returns new access token                            │
│ 5. Retry original request with new token              │
│ 6. If refresh fails → Redirect to /login              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Complete Lead Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│          LEAD LIFECYCLE - COMPLETE FLOW                    │
└────────────────────────────────────────────────────────────┘

ENTRY POINT: Lead is created
├─ How: Manual form, Excel import, or API
├─ Data: Name, Email, Company, Phone, Industry, etc.
├─ Default Status: "Yet to approach"
└─ Default Score: Auto-calculated (0-100)

┌─────────────────────────────────────────────────────────┐
│ Initial State: YET TO APPROACH (Cold Lead)              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Sales Rep Actions:                                      │
│ ├─ Add to CRM                                          │
│ ├─ Review lead score (AI analysis)                     │
│ ├─ View contact info (Email, LinkedIn, Phone)          │
│ ├─ Create task: "Send intro email"                     │
│ ├─ Use AI Copilot: "Generate intro email"             │
│ └─ Mark outcome: Follow-up required                    │
│                                                          │
│ Status stays "Yet to approach" until rep takes action  │
│ Can last: 1 week to several months                      │
│ Lead Score: 10-40 (low engagement)                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
        │
        │ Rep sends email / Makes cold call
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ Active State: IN PROCESS (Engaged)                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Status Changes: Rep updates from "Yet to approach"      │
│ to "In process" in pipeline or spreadsheet              │
│                                                          │
│ Rep Actions During This Phase:                          │
│ ├─ Initial conversation happened                       │
│ ├─ Sent product info/brochure                           │
│ ├─ Follow-up call scheduled                             │
│ ├─ Create task: "Follow-up call on [date]"            │
│ ├─ Log activity: "Call with client, interested"       │
│ ├─ Update custom field: Outcome = "Follow-up"         │
│ └─ Check bac