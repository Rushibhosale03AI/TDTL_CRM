import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import Sidebar from "./components/layout/Sidebar"
import Navbar from "./components/layout/Navbar"
import Dashboard from "./features/dashboard/Dashboard"
import LeadList from "./features/leads/LeadList"
import PipelineBoard from "./features/pipeline/PipelineBoard"
import ContactList from "./features/contacts/ContactList"
import AccountView from "./features/contacts/AccountView"
import ProtectedRoute from "./components/auth/ProtectedRoute"

const App = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar - fixed width 64rem */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Navbar - fixed at top */}
        <Navbar />

        {/* Dynamic Route Content - scrollable */}
        <main className="mt-16 p-8 flex-1 overflow-y-auto">
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<LeadList />} />
              <Route path="/pipeline" element={<PipelineBoard />} />
              <Route path="/contacts" element={<ContactList />} />
              <Route path="/contacts/:id" element={<AccountView />} />
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
