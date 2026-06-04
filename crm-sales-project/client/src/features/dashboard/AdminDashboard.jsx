import React from "react"
import { Users, Briefcase, TrendingUp } from "lucide-react"
import { useDashboard } from "../../hooks/useDashboard"
import QuickExcelActions from "./QuickExcelActions"

const AdminDashboard = () => {
  const { data, loading } = useDashboard()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing System Data...</p>
        </div>
      </div>
    )
  }

  if (!data) return (
    <div className="p-8 text-center rounded-2xl border border-dashed bg-muted/20">
      <p className="text-muted-foreground font-medium">Unable to load system metrics. Please try again later.</p>
    </div>
  )

  const { overview = {}, managers = [] } = data

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            Global overview of regional managers and team performance.
          </p>
        </div>
      </div>

      {/* Quick Excel Actions Hub — available to Admin */}
      <QuickExcelActions />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Managers</h3>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{overview.totalManagers}</div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Global Revenue</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{overview.totalGlobalRevenue}</div>
          <p className="text-xs text-muted-foreground mt-1">+8.2% from last month</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Sales Reps</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{overview.totalSalesReps}</div>
        </div>
      </div>

      {/* Managers Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-4">
          <h3 className="font-semibold text-lg">Regional Managers Overview</h3>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Manager Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Region</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Team Size</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Team Revenue</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Performance</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {managers.map((manager) => (
                <tr key={manager.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-medium">{manager.name}</td>
                  <td className="p-4 align-middle">{manager.region}</td>
                  <td className="p-4 align-middle">{manager.teamSize} reps</td>
                  <td className="p-4 align-middle">{manager.revenue}</td>
                  <td className={`p-4 align-middle ${manager.performance.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {manager.performance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
