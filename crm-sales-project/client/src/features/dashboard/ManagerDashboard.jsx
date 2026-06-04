import React from "react"
import { Users, Target, CheckCircle2 } from "lucide-react"
import { useDashboard } from "../../hooks/useDashboard"
import { useAuth } from "../../hooks/useAuth"
import QuickExcelActions from "./QuickExcelActions"

const ManagerDashboard = () => {
  const { data, loading } = useDashboard()
  const { user } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Team Data...</p>
        </div>
      </div>
    )
  }

  if (!data) return (
    <div className="p-8 text-center rounded-2xl border border-dashed bg-muted/20">
      <p className="text-muted-foreground font-medium">Unable to load dashboard metrics. Please try again later.</p>
    </div>
  )

  const { teamTarget, teamAttainment, activeReps, teamPerformance } = data
  const teamMembers = teamPerformance || []

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

      {/* Quick Excel Actions Hub */}
      <QuickExcelActions />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Team Target</h3>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{teamTarget}</div>
          <p className="text-xs text-muted-foreground mt-1">Monthly combined goal</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Team Attainment</h3>
            <CheckCircle2 className={`h-4 w-4 ${teamAttainment >= 100 ? 'text-green-500' : 'text-primary'}`} />
          </div>
          <div className="text-2xl font-bold">{teamAttainment}%</div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary">
            <div className={`h-full rounded-full ${teamAttainment >= 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min(teamAttainment, 100)}%` }}></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Reps</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{activeReps}</div>
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
