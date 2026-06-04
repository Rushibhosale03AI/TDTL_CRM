import React, { useState } from "react"
import KpiCards from "./KpiCards"
import FunnelChart from "./FunnelChart"
import RevenueChart from "./RevenueChart"
import TaskPanel from "./TaskPanel"
import ActivityFeed from "./ActivityFeed"
import TaskForm from "./TaskForm"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Badge } from "../../components/ui/Badge"
import { Plus, CheckSquare, BarChart3, History, Target, Users, ArrowRight } from "lucide-react"
import { useTasks } from "../../hooks/useTasks"
import { useDashboard } from "../../hooks/useDashboard"
import { useLeads } from "../../hooks/useLeads"
import { useNavigate } from "react-router-dom"
import QuickExcelActions from "./QuickExcelActions"

const Dashboard = () => {
  const { tasks } = useTasks()
  const { leads } = useLeads()
  const { data: dashboardData } = useDashboard()
  const navigate = useNavigate()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  
  const [monthlyTarget, setMonthlyTarget] = useState(50000)
  const [isSettingTarget, setIsSettingTarget] = useState(false)
  const [tempTarget, setTempTarget] = useState(monthlyTarget)

  const pendingTasksCount = Array.isArray(tasks) ? tasks.filter(t => !t.completed).length : 0
  
  // Get recent 5 leads
  const recentLeads = Array.isArray(leads) ? leads.slice(0, 5) : []

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Header section with Royal Violet Gradient */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent border border-primary/10 backdrop-blur-sm">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Sales Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base font-medium">
            Real-time performance metrics, predictive leads, and daily goals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/leads")} className="h-10 font-bold px-5 hover-glow active-shrink rounded-xl">
            Manage Leads
          </Button>
          <Button size="sm" className="h-10 flex items-center gap-2 font-bold px-5 bg-primary hover:opacity-95 shadow-lg shadow-primary/20 hover-glow active-shrink rounded-xl" onClick={() => setIsTaskModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add New Task
          </Button>
        </div>
      </div>

      {/* Quick Excel Actions Hub */}
      <QuickExcelActions />

      {/* Primary KPI Row */}
      <KpiCards />

      {/* Analytics Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Growth Chart */}
        <div className="lg:col-span-2 rounded-2xl border p-8 shadow-sm flex flex-col glass-card hover-glow transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-xl tracking-tight">Revenue Performance</h3>
            </div>
            <div className="flex items-center gap-4">
              {isSettingTarget ? (
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    className="h-9 w-28 text-sm"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(e.target.value)}
                    autoFocus
                  />
                  <Button 
                    size="sm" 
                    className="h-9 px-4 font-bold"
                    onClick={() => {
                      setMonthlyTarget(Number(tempTarget))
                      setIsSettingTarget(false)
                    }}
                  >
                    Set
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 text-[11px] font-black text-muted-foreground uppercase flex items-center gap-2 border bg-muted/30 hover:bg-muted rounded-lg"
                  onClick={() => setIsSettingTarget(true)}
                >
                  <Target className="h-4 w-4" />
                  Target: ₹{monthlyTarget.toLocaleString()}
                </Button>
              )}
            </div>
          </div>
          <div className="h-[300px]">
            <RevenueChart />
          </div>
        </div>

        {/* Task Reminders Panel */}
        <div className="rounded-2xl border p-8 shadow-sm flex flex-col glass-card hover-glow transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-xl tracking-tight">Tasks</h3>
            </div>
            {pendingTasksCount > 0 && (
              <Badge className="bg-orange-500 text-white border-none font-black px-2 py-0.5 rounded-full text-[10px]">
                {pendingTasksCount} PENDING
              </Badge>
            )}
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            <TaskPanel />
          </div>
          <Button variant="outline" className="w-full mt-6 text-xs font-black uppercase tracking-widest border-2 hover:bg-muted rounded-xl hover-glow active-shrink" onClick={() => navigate("/pipeline")}>
            GO TO PIPELINE
          </Button>
        </div>
      </div>

      {/* RECENT DATA SECTION (Showing actual entered data) */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border p-8 shadow-sm glass-card hover-glow transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-xl tracking-tight">Recent Opportunities</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-bold text-primary group" onClick={() => navigate("/leads")}>
              View All Leads <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest font-black text-muted-foreground border-b pb-4">
                  <th className="pb-3 px-2">Lead</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentLeads.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-sm text-muted-foreground italic">
                      No recent leads found.
                    </td>
                  </tr>
                ) : (
                  recentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => navigate("/leads")}>
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm group-hover:text-primary transition-colors">{lead.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">{lead.company}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <Badge variant="outline" className="text-[9px] font-black rounded-md">{lead.status.toUpperCase()}</Badge>
                      </td>
                      <td className="py-4 px-2 text-right font-bold text-sm">
                        ₹{Number(lead.value).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity & History Feed */}
        <div className="lg:col-span-2 rounded-2xl border p-8 shadow-sm glass-card hover-glow transition-all duration-300">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
              <History className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-xl tracking-tight">Interaction History</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            <ActivityFeed />
          </div>
        </div>
      </div>

      <TaskForm 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
      />
    </div>
  )
}

export default Dashboard
