import React from "react"
import { Edit2, Trash2, UserPlus } from "lucide-react"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { useStore } from "../../store/state"
import { useAuth } from "../../hooks/useAuth"

const LeadTable = ({ onEdit }) => {
  const { leads, deleteLead, updateLead, mockUsers } = useStore()
  const { user } = useAuth()
  
  const salesReps = mockUsers.filter(u => u.role === 'sales')

  // Filter leads: sales reps only see their own, managers/admins see all
  const filteredLeads = user?.role === 'sales' 
    ? leads.filter(l => l.assignedTo === user.id)
    : leads

  const getStatusVariant = (status) => {
    switch (status) {
      case "Won": return "success"
      case "Lost": return "destructive"
      case "Qualified": return "secondary"
      case "New": return "outline"
      case "Proposal":
      case "Negotiation": return "default"
      default: return "outline"
    }
  }

  const getAssignedRepName = (id) => {
    const rep = mockUsers.find(u => u.id === id)
    return rep ? rep.name : "Unassigned"
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated Value</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned To</th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                  No leads found. Start by adding a new lead!
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{lead.name}</span>
                      <span className="text-xs text-muted-foreground">{lead.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    ${Number(lead.value).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-xs space-y-1">
                      <span className="text-muted-foreground truncate max-w-[150px]">{lead.email}</span>
                      <span className="text-muted-foreground">{lead.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                        {getAssignedRepName(lead.assignedTo).charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{getAssignedRepName(lead.assignedTo)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <select 
                        title="Re-assign Lead"
                        value={lead.assignedTo || ""}
                        onChange={(e) => updateLead(lead.id, { assignedTo: Number(e.target.value) })}
                        className="h-8 w-8 text-transparent bg-transparent focus:text-foreground cursor-pointer absolute opacity-0"
                        style={{ width: '32px' }}
                      >
                        <option value="" disabled>Re-assign...</option>
                        {salesReps.map(rep => (
                          <option key={rep.id} value={rep.id}>{rep.name}</option>
                        ))}
                      </select>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground relative pointer-events-none">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => onEdit(lead)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this lead?")) {
                            deleteLead(lead.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LeadTable
