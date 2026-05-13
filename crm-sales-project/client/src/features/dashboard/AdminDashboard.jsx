import React from "react"
import { Users, Briefcase, TrendingUp } from "lucide-react"

const AdminDashboard = () => {
  // Mock data for managers
  const managers = [
    { id: 1, name: "Sarah Connor", region: "North America", teamSize: 12, revenue: "$450,000", performance: "+15%" },
    { id: 2, name: "John Smith", region: "Europe", teamSize: 8, revenue: "$320,000", performance: "+8%" },
    { id: 3, name: "Elena Rodriguez", region: "Latin America", teamSize: 5, revenue: "$180,000", performance: "-2%" },
  ]

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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Managers</h3>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{managers.length}</div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Global Revenue</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">$950,000</div>
          <p className="text-xs text-muted-foreground mt-1">+8.2% from last month</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Sales Reps</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">25</div>
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
