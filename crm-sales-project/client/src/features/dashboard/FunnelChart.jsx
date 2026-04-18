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
import { useStore } from "../../store/state"

const FunnelChart = () => {
  const { leads } = useStore()

  // Define the stages in order
  const stages = [
    { name: "New", color: "#94a3b8" },
    { name: "Follow-up", color: "#64748b" },
    { name: "Qualified", color: "#3b82f6" },
    { name: "Meeting", color: "#2563eb" },
    { name: "Requirements", color: "#1d4ed8" },
    { name: "Proposal", color: "#1e40af" },
    { name: "Negotiation", color: "#1e3a8a" },
    { name: "Won", color: "#166534" },
  ]

  // Calculate live counts for each stage
  const data = stages.map(stage => ({
    name: stage.name,
    value: leads.filter(l => l.status === stage.name).length,
    color: stage.color
  })).filter(d => d.value >= 0) // Keep all stages for funnel visualization

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
