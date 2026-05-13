import React from "react"
import { useAuth } from "../../hooks/useAuth"
import AdminDashboard from "./AdminDashboard"
import ManagerDashboard from "./ManagerDashboard"
import Dashboard from "./Dashboard"

const DashboardWrapper = () => {
  const { user } = useAuth()

  if (!user) return null

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />
    case 'manager':
      return <ManagerDashboard />
    case 'sales':
    default:
      return <Dashboard />
  }
}

export default DashboardWrapper
