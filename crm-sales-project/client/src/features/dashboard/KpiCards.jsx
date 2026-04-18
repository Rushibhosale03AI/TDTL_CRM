import React from "react"
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock 
} from "lucide-react"
import { useStore } from "../../store/state"

const KpiCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="rounded-xl border bg-card p-6 shadow-sm">
    <div className="flex items-center justify-between space-y-0 pb-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <Icon className={`h-4 w-4 ${colorClass}`} />
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground">{subtext}</p>
  </div>
)

const KpiCards = () => {
  const { leads } = useStore()

  // Dynamic calculations
  const totalLeads = leads.length
  const wonLeads = leads.filter(l => l.status === "Won")
  const convertedCount = wonLeads.length
  const totalRevenue = wonLeads.reduce((sum, l) => sum + Number(l.value || 0), 0)
  const pendingLeads = leads.filter(l => !["Won", "Lost"].includes(l.status)).length

  const conversionRate = totalLeads > 0 
    ? ((convertedCount / totalLeads) * 100).toFixed(1) 
    : 0

  const kpis = [
    {
      title: "Total Leads",
      value: totalLeads.toLocaleString(),
      subtext: "Live database count",
      icon: Users,
      colorClass: "text-blue-500",
    },
    {
      title: "Converted",
      value: convertedCount.toLocaleString(),
      subtext: `${conversionRate}% conversion rate`,
      icon: TrendingUp,
      colorClass: "text-green-500",
    },
    {
      title: "Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      subtext: "From won deals only",
      icon: DollarSign,
      colorClass: "text-indigo-500",
    },
    {
      title: "Pipeline Active",
      value: pendingLeads.toLocaleString(),
      subtext: "In progress deals",
      icon: Clock,
      colorClass: "text-yellow-500",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.title} {...kpi} />
      ))}
    </div>
  )
}

export default KpiCards
