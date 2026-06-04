import React from "react"
import { Users, Target, CheckCircle2 } from "lucide-react"
import { useStore } from "../../store/state"
import { useAuth } from "../../hooks/useAuth"

const ManagerDashboard = () => {
  const { monthlyTarget, mockUsers } = useStore()
  const { user } = useAuth()
  
  // Find team members assigned to this specific manager
  let teamMembers = mockUsers
    .filter(u => u.role === 'sales' && u.managerId === user?.id)
    .map(u => ({
      id: u.id,
      name: u.name,
      role: "Sales Representative",
      dealsClosed: Math.floor(Math.random() * 20), // mock random data
      revenue: `$${(Math.floor(Math.random() * 50) * 1000).toLocaleString()}`,
      targetProgress: Math.floor(Math.random() * 60) + 40 // random between 40-100%
    }))

  // If no one is assigned yet, maybe show some default mocks or empty state. We'll add some dummy fallback if empty for UI presentation.
  if (teamMembers.length === 0) {
    teamMembers = [
      { id: 101, name: "No reps registered under your team yet", role: "-", dealsClosed: 0, revenue: "$0", targetProgress: 0 }
    ]
  }

  const totalRevenue = teamMembers.reduce((acc, curr) => {
    const revNum = parseInt(curr.revenue.replace(/[^0-9.-]+/g,"")) || 0;
    return acc + revNum;
  }, 0)
  
  const avgProgress = teamMembers.length > 0 && teamMembers[0].id !== 101 
    ? Math.floor(teamMembers.reduce((acc, curr) => acc + curr.targetProgress, 0) / teamMembers.length)
    : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            Track your team's progress, targets, and recent wins.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Team Target</h3>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">${(monthlyTarget * Math.max(1, teamMembers.filter(m => m.id !== 101).length)).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Monthly combined goal</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Team Attainment</h3>
            <CheckCircle2 className={`h-4 w-4 ${avgProgress >= 100 ? 'text-green-500' : 'text-primary'}`} />
          </div>
          <div className="text-2xl font-bold">{avgProgress}%</div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary">
            <div className={`h-full rounded-full ${avgProgress >= 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min(avgProgress, 100)}%` }}></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Reps</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{teamMembers.filter(m => m.id !== 101).length}</div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-4">
          <h3 className="font-semibold text-lg">Team Performance</h3>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rep Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Deals Closed</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Revenue Generated</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Target Progress</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {teamMembers.map((member) => (
                <tr key={member.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-medium">{member.name}</td>
                  <td className="p-4 align-middle text-muted-foreground">{member.role}</td>
                  <td className="p-4 align-middle">{member.dealsClosed}</td>
                  <td className="p-4 align-middle font-medium">{member.revenue}</td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-right text-xs">{member.targetProgress}%</span>
                      <div className="h-2 w-24 rounded-full bg-secondary">
                        <div 
                          className={`h-full rounded-full ${member.targetProgress >= 100 ? 'bg-green-500' : 'bg-primary'}`} 
                          style={{ width: `${Math.min(member.targetProgress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
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

export default ManagerDashboard
