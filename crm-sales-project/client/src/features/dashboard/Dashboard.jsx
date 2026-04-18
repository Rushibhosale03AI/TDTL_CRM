import React, { useState } from "react"
import KpiCards from "./KpiCards"
import FunnelChart from "./FunnelChart"
import RevenueChart from "./RevenueChart"
import TaskPanel from "./TaskPanel"
import ActivityFeed from "./ActivityFeed"
import TaskForm from "./TaskForm"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Plus, CheckSquare, BarChart3, History, Target } from "lucide-react"
import { useStore } from "../../store/state"
import { useNavigate } from "react-router-dom"

const Dashboard = () => {
  const { tasks, monthlyTarget, setMonthlyTarget } = useStore()
  const navigate = useNavigate()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isSettingTarget, setIsSettingTarget] = useState(false)
  const [tempTarget, setTempTarget] = useState(monthlyTarget)

  const pendingTasksCount = tasks.filter(t => !t.completed).length

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            Detailed performance tracking and actionable reminders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/leads")} className="h-9">
            Manage Leads
          </Button>
          <Button size="sm" className="h-9 flex items-center gap-2" onClick={() => setIsTaskModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add New Task
          </Button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <KpiCards />

      {/* Analytics & Tasks Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Growth Chart */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Revenue Performance</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-[10px] font-bold uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Revenue
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-[10px] font-bold uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-slate-400" /> Target
                </div>
              </div>

              {isSettingTarget ? (
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    className="h-8 w-24 text-xs"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(e.target.value)}
                    autoFocus
                  />
                  <Button 
                    size="sm" 
                    className="h-8 px-2"
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
                  className="h-8 text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 border hover:bg-muted"
                  onClick={() => setIsSettingTarget(true)}
                >
                  <Target className="h-3 w-3" />
                  Set Target: ${monthlyTarget.toLocaleString()}
                </Button>
              )}
            </div>
          </div>
          <RevenueChart />
        </div>

        {/* Task Reminders Panel */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Task Reminders</h3>
            </div>
            {pendingTasksCount > 0 && (
              <span className="h-5 min-w-5 flex items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {pendingTasksCount}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
            <TaskPanel />
          </div>
          <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-primary hover:bg-primary/5">
            VIEW ALL TASKS
          </Button>
        </div>
      </div>

      {/* Pipeline & Activity History Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Funnel */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Sales Funnel</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground p-1 border rounded px-2">Live Pipeline</span>
          </div>
          <div className="h-[350px] w-full">
            <FunnelChart />
          </div>
        </div>

        {/* Activity & History Feed */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Interaction History</h3>
            </div>
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
