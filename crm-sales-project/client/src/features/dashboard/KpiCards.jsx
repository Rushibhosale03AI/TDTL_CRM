import React from "react"
import { 
  Users, 
  TrendingUp, 
  IndianRupee, 
  Clock 
} from "lucide-react"
import { useDashboard } from "../../hooks/useDashboard"
import { useAuth } from "../../hooks/useAuth"

const KpiCard = ({ title, value, trend, icon: Icon, colorClass }) => (
  <div className="rounded-xl border bg-card p-6 shadow-sm">
    <div className="flex items-center justify-between space-y-0 pb-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <Icon className={`h-4 w-4 ${colorClass}`} />
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground">{trend}</p>
  </div>
)

const KpiCards = () => {
  const { data, loading } = useDashboard()
  
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded-xl border bg-card p-6 animate-pulse" />
        ))}
      </div>
    )
  }

  const kpiCards = data?.kpiCards || []
  if (kpiCards.length === 0) return null

  const iconMap = {
    Users,
    TrendingUp,
    IndianRupee,
    Clock,
    Percent: TrendingUp // Fallback
  }

  const colorMap = {
    "Total Leads": "text-blue-500",
    "Active Pipeline": "text-indigo-500",
    "Closed Revenue": "text-green-500",
    "Conversion Rate": "text-yellow-500"
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((kpi) => (
        <KpiCard 
          key={kpi.title} 
          title={kpi.title}
          value={kpi.value}
          trend={kpi.trend}
          icon={iconMap[kpi.icon] || Users}
          colorClass={colorMap[kpi.title] || "text-primary"}
        />
      ))}
    </div>
  )
}

export default KpiCards
