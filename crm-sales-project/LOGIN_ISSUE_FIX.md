# Login Issue Fix - 401 Error

## Problem
The login page shows "Request failed with status code 401" error.

## Root Cause
The error occurs when there are stale/invalid JWT tokens in the browser's localStorage. When the app loads, it tries to validate the old token by calling `/api/auth/me/`, which fails with a 401 error.

## Solution Applied

### 1. Clear Stale Tokens on Login Page Load
Added code to the Login component to automatically clear any old tokens when the user is not authenticated:

```javascript
React.useEffect(() => {
  const hasOldToken = localStorage.getItem('access_token')
  if (hasOldToken && !isAuthenticated) {
    // Clear potentially invalid tokens
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}, [isAuthenticated])
```

### 2. Improved Error Handling
Enhanced the login submission handler to provide better error feedback:
- Validates that both email and password are entered
- Provides helpful error messages if login fails

## Manual Fix (if still seeing the issue)

If you're still seeing the 401 error, manually clear the browser's localStorage:

1. Open browser DevTools (F12)
2. Go to the "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Find "Local Storage" in the left sidebar
4. Click on your site (http://localhost:5175 or http://127.0.0.1:5175)
5. Delete the following keys:
   - `access_token`
   - `refresh_token`
6. Refresh the page

Alternatively, use the browser console:
```javascript
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')
location.reload()
```

## Test Credentials

The following test accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@test.com | password | Admin |
| manager@test.com | password | Manager |
| sales@test.com | password | Sales |

## Backend Verification

The backend API is working correctly. You can verify by running this PowerShell command:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login/" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@test.com","password":"password"}'
```

Expected output: JWT tokens and user data

## Server Status

- Backend Server: ✅ Running on port 8000
- Frontend Server: ✅ Running on port 5175 (or 5173/5174)
- Database: ✅ MySQL running with 50+ users
- CORS: ✅ Configured to allow all origins in development

## Files Modified
- `TDTL_CRM/crm-sales-project/client/src/features/auth/Login.jsx`

## Next Steps

1. Clear browser localStorage (see manual fix above)
2. Refresh the login page
3. Try logging in with test credentials
4. The error should no longer appear

## Additional Notes

- The 401 error in the logs is normal when accessing protected endpoints without a valid token
- The `useAuth` hook automatically tries to validate any existing token on app load
- If the token is invalid/expired, it gets cleared and the user is shown the login page
- This fix ensures stale tokens don't cause confusion on the login page
