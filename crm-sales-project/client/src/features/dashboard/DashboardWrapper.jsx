import React from "react"
import { useAuth } from "../../hooks/useAuth"
import AdminDashboard from "./AdminDashboard"
import ManagerDashboard from "./ManagerDashboard"
import Dashboard from "./Dashboard"

const DashboardWrapper = () => {
  const { user } = useAuth()

  if (!user) return null

  const userRole = user.role?.toLowerCase()
  switch (userRole) {
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
