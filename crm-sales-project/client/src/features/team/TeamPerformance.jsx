import React, { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useDashboard } from "../../hooks/useDashboard"
import { BarChart3, TrendingUp, Users, Target, Award, ArrowUpRight, ArrowDownRight, Filter, X, ChevronDown } from "lucide-react"
import RevenueChart from "../dashboard/RevenueChart"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"

const TeamPerformance = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: dashboardData } = useDashboard()
  const [expandedRow, setExpandedRow] = useState(null)
  const [sortBy, setSortBy] = useState('revenue')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Get manager filter from URL
  const managerIdFilter = searchParams.get('manager')

  const clearFilter = () => {
    setSearchParams({})
  }

  // Extract data with fallbacks
  const overview = dashboardData?.overview || {}
  const teamPerformanceData = dashboardData?.teamPerformance || []

  // Filter team performance by manager if filter is active
  let filteredTeamPerformance = teamPerformanceData
  if (managerIdFilter && teamPerformanceData.length > 0) {
    filteredTeamPerformance = teamPerformanceData.filter(member => 
      String(member.managerId) === managerIdFilter || 
      String(member.manager_id) === managerIdFilter ||
      String(member.manager?.id) === managerIdFilter
    )
  }

  // Sort team performance
  const sortedTeamPerformance = [...filteredTeamPerformance].sort((a, b) => {
    if (sortBy === 'revenue') {
      const aRev = parseFloat(a.revenue?.replace(/[^0-9]/g, '') || 0)
      const bRev = parseFloat(b.revenue?.replace(/[^0-9]/g, '') || 0)
      return bRev - aRev
    } else if (sortBy === 'deals') {
      return (b.dealsClosed || 0) - (a.dealsClosed || 0)
    } else if (sortBy === 'target') {
      return (b.targetProgress || 0) - (a.targetProgress || 0)
    }
    return 0
  })

  // Filter by status
  let displayPerformance = sortedTeamPerformance
  if (filterStatus !== 'all') {
    displayPerformance = sortedTeamPerformance.filter(rep => {
      if (filterStatus === 'active') return rep.dealsClosed > 0
      if (filterStatus === 'pending') return rep.dealsClosed === 0
      return true
    })
  }
  
  const stats = [
    { 
      label: "Team Revenue", 
      value: overview.totalTeamRevenue || "₹225000", 
      target: `Target: ${overview.teamTarget || "₹250000"}`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      trend: `${overview.teamAttainment || 85}%`,
      isUp: true
    },
    { 
      label: "Active Members", 
      value: overview.activeReps || 4, 
      target: "Direct Reports",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      trend: "Active",
      isUp: true
    },
    { 
      label: "Total Team Leads", 
      value: overview.totalTeamLeads || 45, 
      target: "Across all reps",
      icon: Award,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      trend: "+12.5%",
      isUp: true
    },
    { 
      label: "Task Achievement", 
      value: `${overview.taskCompletionRate || 78}%`, 
      target: "Team Productivity",
      icon: Target,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      trend: "Live",
      isUp: true
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">Team Performance</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Analyze aggregated team metrics and sales effectiveness.
        </p>
        {managerIdFilter && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-bold flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Filtered by Manager ID: {managerIdFilter}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilter}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <Badge variant="outline" className={`text-[10px] font-black flex items-center gap-1 ${stat.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.trend}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black text-foreground mt-1">{stat.value}</h3>
              <p className="text-xs font-bold text-muted-foreground mt-2 flex items-center gap-1">
                {stat.target}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl">Monthly Revenue Trend</h3>
            </div>
          </div>
          <div className="h-[350px]">
            <RevenueChart />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <h3 className="font-bold text-xl mb-6">Top Performers</h3>
          <div className="space-y-6">
            {teamPerformanceData?.slice(0, 3).map((member, i) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center font-black text-sm text-white">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{member.dealsClosed} deals closed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-primary">{member.revenue}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">{member.targetProgress}% target</p>
                </div>
              </div>
            ))}
            {teamPerformanceData?.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-10">No performance data yet.</p>
            )}
          </div>
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="font-bold">Team Quota Progress</span>
              <span className="font-black text-primary">{overview.teamAttainment || 85}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000" 
                style={{ width: `${overview.teamAttainment || 85}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-xl">Operational Achievement (Tasks)</h3>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border bg-background cursor-pointer"
            >
              <option value="revenue">Sort by Revenue</option>
              <option value="deals">Sort by Deals</option>
              <option value="target">Sort by Target %</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border bg-background cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-muted-foreground border-b border-border/50">
                <th className="pb-4 w-8"></th>
                <th className="pb-4">Activity Name</th>
                <th className="pb-4">Assigned To</th>
                <th className="pb-4">Revenue</th>
                <th className="pb-4">Deals</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {displayPerformance.map((rep) => (
                <React.Fragment key={rep.id}>
                  <tr className="text-sm group hover:bg-muted/30 transition-colors cursor-pointer" 
                      onClick={() => setExpandedRow(expandedRow === rep.id ? null : rep.id)}>
                    <td className="py-4 px-2">
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedRow === rep.id ? 'rotate-180' : ''}`} />
                    </td>
                    <td className="py-4 font-bold">Client Follow-up Pipeline</td>
                    <td className="py-4 text-muted-foreground">{rep.name}</td>
                    <td className="py-4 font-bold text-primary">{rep.revenue || '₹0'}</td>
                    <td className="py-4 font-bold">{rep.dealsClosed || 0}</td>
                    <td className="py-4">
                      <Badge variant={rep.dealsClosed > 0 ? "default" : "secondary"} className="text-[10px] font-bold">
                        {rep.dealsClosed > 0 ? "ACTIVE" : "PENDING"}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: `${rep.targetProgress}%` }} />
                        </div>
                        <span className="text-[10px] font-black">{rep.targetProgress}%</span>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === rep.id && (
                    <tr className="bg-muted/20">
                      <td colSpan="7" className="py-4 px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Manager</p>
                            <p className="font-bold mt-1">{rep.manager?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Contact</p>
                            <p className="font-bold mt-1">{rep.email || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Team</p>
                            <p className="font-bold mt-1">{rep.team || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Last Update</p>
                            <p className="font-bold mt-1">{rep.lastUpdate || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {displayPerformance.length === 0 && (
            <div className="py-12 text-center text-muted-foreground italic text-sm">
              No task data currently available for display.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamPerformance
