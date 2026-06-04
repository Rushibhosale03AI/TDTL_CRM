import React from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import Sidebar from "./components/layout/Sidebar"
import Navbar from "./components/layout/Navbar"
import DashboardWrapper from "./features/dashboard/DashboardWrapper"
import LeadList from "./features/leads/LeadList"
import PipelineBoard from "./features/pipeline/PipelineBoard"
import ContactList from "./features/contacts/ContactList"
import AccountView from "./features/contacts/AccountView"
import Approvals from "./features/approvals/Approvals"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import Login from "./features/auth/Login"
import Register from "./features/auth/Register"
import TeamList from "./features/team/TeamList"
import TeamPerformance from "./features/team/TeamPerformance"
import ManagersList from "./features/team/ManagersList"
import EveningReports from "./features/dashboard/EveningReports"
import AICopilot from "./features/dashboard/AICopilot"
import GlobalReports from "./features/dashboard/GlobalReports"
import ProfileSettings from "./features/dashboard/ProfileSettings"
import FloatingAICopilot from "./features/dashboard/FloatingAICopilot"

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
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/leads" element={<LeadList />} />
              <Route path="/pipeline" element={<PipelineBoard />} />
              <Route path="/contacts" element={<ContactList />} />
              <Route path="/contacts/:id" element={<AccountView />} />
              <Route path="/team" element={<TeamList />} />
              <Route path="/performance" element={<TeamPerformance />} />
              <Route path="/eod" element={<EveningReports />} />
              <Route path="/ai-copilot" element={<AICopilot />} />
              <Route path="/reports" element={<GlobalReports />} />
              
              <Route path="/managers" element={<ManagersList />} />
              <Route path="/settings" element={<ProfileSettings />} />
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      {!isAuthRoute && <FloatingAICopilot />}
    </div>
  )
}

export default App
