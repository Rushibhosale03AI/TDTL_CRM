import React, { useState } from "react"
import { useLeads } from "../../hooks/useLeads"
import { useUsers } from "../../hooks/useUsers"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import DetailModal from "../../components/ui/DetailModal"
import { 
  IndianRupee, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  Tag,
  ArrowRight,
  RefreshCw,
  Plus,
  Briefcase
} from "lucide-react"

const STAGES = [
  { id: "Yet to approach", title: "Yet To Approach", color: "bg-blue-500/10 text-blue-500 border-blue-500/20 glow-blue", dotColor: "bg-blue-500" },
  { id: "In process", title: "In Process", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 glow-indigo", dotColor: "bg-indigo-500" },
  { id: "Rescheduled", title: "Rescheduled", color: "bg-purple-500/10 text-purple-500 border-purple-500/20 glow-purple", dotColor: "bg-purple-500" },
  { id: "No Show", title: "No Show", color: "bg-pink-500/10 text-pink-500 border-pink-500/20 glow-pink", dotColor: "bg-pink-500" },
  { id: "Completed", title: "Completed", color: "bg-amber-500/10 text-amber-500 border-amber-500/20 glow-amber", dotColor: "bg-amber-500" },
]

const PipelineBoard = () => {
  const { leads, updateLead, fetchLeads, loading } = useLeads()
  const { users } = useUsers()
  const [selectedLead, setSelectedLead] = useState(null)
  const [draggedOverStage, setDraggedOverStage] = useState(null)
  
  const pipelineLeads = Array.isArray(leads) ? leads : []

  const getAssignedRepName = (id) => {
    const safeUsers = Array.isArray(users) ? users : []
    const rep = safeUsers.find(u => u.id === id)
    return rep ? (rep.name || rep.email) : "Unassigned"
  }

  const getAssignedRepInitials = (id) => {
    const name = getAssignedRepName(id)
    if (name === "Unassigned") return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  // Drag and drop handlers
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData("text/plain", leadId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e, stageId) => {
    e.preventDefault()
    if (draggedOverStage !== stageId) {
      setDraggedOverStage(stageId)
    }
  }

  const handleDragLeave = () => {
    setDraggedOverStage(null)
  }

  const handleDrop = async (e, stageId) => {
    e.preventDefault()
    setDraggedOverStage(null)
    const leadId = e.dataTransfer.getData("text/plain")
    if (leadId) {
      // Find lead to verify stage difference
      const lead = pipelineLeads.find(l => String(l.id) === String(leadId))
      if (lead && lead.status !== stageId) {
        await updateLead(lead.id, { status: stageId })
      }
    }
  }

  const leadFields = [
    { key: "name", label: "Full Name", icon: User },
    { key: "company", label: "Company", icon: Building },
    { key: "email", label: "Email Address", icon: Mail },
    { key: "phone", label: "Phone Number", icon: Phone },
    { key: "status", label: "Current Status", icon: Tag },
    { 
      key: "value", 
      label: "Estimated Value", 
      icon: IndianRupee,
      format: (val) => `₹${Number(val || 0).toLocaleString()}`
    },
    { 
      key: "assignedTo", 
      label: "Assigned Representative", 
      icon: User,
      format: (id) => getAssignedRepName(id)
    },
    { 
      key: "createdAt", 
      label: "Created Date", 
      icon: Calendar,
      format: (date) => new Date(date).toLocaleDateString('en-IN', { dateStyle: 'long' })
    },
  ]

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/30 p-6 rounded-2xl border border-border/40 shadow-sm backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            Interactive Sales Pipeline
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Drag and drop deal cards to transition leads or update them instantly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchLeads()} 
            disabled={loading}
            className="font-bold h-10 px-5 flex items-center gap-2 border-border hover:bg-muted/50 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Funnel
          </Button>
        </div>
      </div>

      {/* Horizontal Scroll Kanban Container */}
      <div className="flex-1 overflow-x-auto pb-6 flex gap-4 min-h-[620px] select-none pr-4 scrollbar-thin">
        {STAGES.map((stage) => {
          const stageLeads = pipelineLeads.filter((l) => l.status === stage.id)
          const stageTotal = stageLeads.reduce((sum, l) => sum + Number(l.value || 0), 0)
          const isOver = draggedOverStage === stage.id
          
          return (
            <div 
              key={stage.id} 
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`flex flex-col w-80 shrink-0 bg-card/45 rounded-2xl border p-4 space-y-4 transition-all duration-200 ${
                isOver ? 'border-primary bg-primary/[0.04] scale-[1.01] shadow-lg ring-2 ring-primary/20' : 'border-border/60'
              }`}
            >
              {/* Stage Header */}
              <div className="flex flex-col gap-2 border-b border-border/40 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${stage.dotColor} shadow-md`} />
                    <span className="font-extrabold text-sm tracking-wide text-foreground uppercase">
                      {stage.title}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-black text-[10px] px-2 py-0.5 rounded-full bg-muted/65 text-muted-foreground border-none">
                    {stageLeads.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Value:</span>
                  <span className="text-foreground font-black text-sm">₹{stageTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Scrollable Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[520px] scrollbar-thin">
                {stageLeads.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-border/40 bg-muted/5 flex flex-col items-center justify-center text-center p-4">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                      No Active Deals
                    </p>
                    <p className="text-[9px] text-muted-foreground/40 mt-1 uppercase">
                      Drag leads here
                    </p>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => setSelectedLead(lead)}
                      className="group bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-grab active:cursor-grabbing space-y-3 relative overflow-hidden"
                    >
                      {/* Left glowing edge matching stage status */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${stage.dotColor}`} />
                      
                      <div className="flex flex-col gap-1 pl-1">
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {lead.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase font-extrabold tracking-tight">
                          <Building className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{lead.company}</span>
                        </div>
                      </div>

                      {/* Info Row: Value & Rep Avatar */}
                      <div className="flex items-center justify-between border-t border-border/30 pt-3 pl-1">
                        <div className="flex items-center gap-1 text-primary">
                          <span className="font-black text-sm">
                            ₹{Number(lead.value || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Rep Avatar Badge */}
                        <div 
                          title={`Assigned to ${getAssignedRepName(lead.assignedTo)}`}
                          className="flex items-center gap-1.5 bg-muted/50 py-1 px-2 rounded-lg border border-border/30"
                        >
                          <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black shrink-0">
                            {getAssignedRepInitials(lead.assignedTo)}
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground max-w-[70px] truncate">
                            {getAssignedRepName(lead.assignedTo).split(" ")[0]}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Action - stops propagation to click-to-modal */}
                      <div className="pt-2 border-t border-border/20 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase">Stage:</span>
                        <select 
                          title="Change Lead Stage"
                          value={lead.status}
                          onChange={(e) => updateLead(lead.id, { status: e.target.value })}
                          className="text-[10px] font-bold uppercase bg-muted/60 border border-border/30 rounded-lg px-2 py-1 cursor-pointer focus:ring-1 focus:ring-primary/20 text-foreground"
                        >
                          {STAGES.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <DetailModal 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)}
        title="Deal Details"
        data={selectedLead || {}}
        fields={leadFields}
      />
    </div>
  )
}

export default PipelineBoard
