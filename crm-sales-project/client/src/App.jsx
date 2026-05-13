import React from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import Sidebar from "./components/layout/Sidebar"
import Navbar from "./components/layout/Navbar"
import DashboardWrapper from "./features/dashboard/DashboardWrapper"
import LeadList from "./features/leads/LeadList"
import PipelineBoard from "./features/pipeline/PipelineBoard"
import ContactList from "./features/contacts/ContactList"
import AccountView from "./features/contacts/AccountView"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import Login from "./features/auth/Login"
import Register from "./features/auth/Register"

const App = () => {
  const location = useLocation()
  
  // Check if we are on an auth route (login/register)
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className={`min-h-screen bg-background text-foreground ${!isAuthRoute ? 'flex' : ''}`}>
      {!isAuthRoute && <Sidebar />}

      <div className={`${!isAuthRoute ? 'flex-1 ml-64 flex flex-col' : 'w-full h-screen'}`}>
        {!isAuthRoute && <Navbar />}

        <main className={`${!isAuthRoute ? 'mt-16 p-8 flex-1 overflow-y-auto' : 'h-full'}`}>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardWrapper />} />
              <Route path="/leads" element={<LeadList />} />
              <Route path="/pipeline" element={<PipelineBoard />} />
              <Route path="/contacts" element={<ContactList />} />
              <Route path="/contacts/:id" element={<AccountView />} />
              {/* Dummy routes for new sidebar items to prevent 404s */}
              <Route path="/managers" element={<div className="p-4 border rounded-lg bg-card mt-4"><h2 className="text-xl font-bold">Managers List</h2><p className="text-muted-foreground mt-2">Feature coming soon...</p></div>} />
              <Route path="/reports" element={<div className="p-4 border rounded-lg bg-card mt-4"><h2 className="text-xl font-bold">Global Reports</h2><p className="text-muted-foreground mt-2">Feature coming soon...</p></div>} />
              <Route path="/team" element={<div className="p-4 border rounded-lg bg-card mt-4"><h2 className="text-xl font-bold">Team Members</h2><p className="text-muted-foreground mt-2">Feature coming soon...</p></div>} />
              <Route path="/performance" element={<div className="p-4 border rounded-lg bg-card mt-4"><h2 className="text-xl font-bold">Team Performance</h2><p className="text-muted-foreground mt-2">Feature coming soon...</p></div>} />
              <Route path="/settings" element={<div className="p-4 border rounded-lg bg-card mt-4"><h2 className="text-xl font-bold">Settings Page</h2><p className="text-muted-foreground mt-2">Coming soon...</p></div>} />
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
