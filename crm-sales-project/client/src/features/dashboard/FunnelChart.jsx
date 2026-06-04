import React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { useDashboard } from "../../hooks/useDashboard"

const FunnelChart = () => {
  const { data: dashboardData, loading } = useDashboard()

  if (loading) return <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">Loading chart...</div>

  if (!dashboardData || !dashboardData.funnelData) {
    return <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground text-sm">No funnel data available</div>
  }

  // Define the colors in order
  const stageColors = {
    "New": "#94a3b8",
    "Follow-up": "#64748b",
    "Qualified": "#3b82f6",
    "Meeting": "#2563eb",
    "Requirements": "#1d4ed8",
    "Proposal": "#1e40af",
    "Negotiation": "#1e3a8a",
    "Won": "#166534",
    "Lost": "#ef4444"
  }
  
  const data = dashboardData.funnelData.map(d => ({
    ...d,
    color: stageColors[d.name] || "#ccc"
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.1)" />
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          width={100}
          fontSize={12}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: "white", 
            borderRadius: "8px", 
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" 
          }}
          cursor={{ fill: "rgba(0,0,0,0.05)" }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default FunnelChart
