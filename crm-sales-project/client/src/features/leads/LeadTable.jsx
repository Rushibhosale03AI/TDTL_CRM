import React, { useState } from "react"
import { Edit2, Trash2, UserPlus, User, Building, Mail, Phone, Calendar, IndianRupee, Tag, Briefcase, MapPin } from "lucide-react"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import DetailModal from "../../components/ui/DetailModal"
import { useLeads } from "../../hooks/useLeads"
import { useAuth } from "../../hooks/useAuth"
import { useUsers } from "../../hooks/useUsers"

const LeadTable = ({ onEdit, leads }) => {
  const { deleteLead, updateLead } = useLeads({ skipFetchOnMount: true })
  const { user } = useAuth()
  const { users } = useUsers()
  const [selectedLead, setSelectedLead] = useState(null)
  
  const safeUsers = Array.isArray(users) ? users : []
  const salesReps = safeUsers.filter(u => u.role === 'sales' || u.role === 'SALES')

  const filteredLeads = Array.isArray(leads) ? leads : []

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
    const rep = safeUsers.find(u => u.id === id)
    return rep ? rep.name : "Unassigned"
  }

  const leadFields = [
    { key: "name", label: "Full Name", icon: User },
    { key: "company", label: "Company", icon: Building },
    { key: "email", label: "Email Address", icon: Mail },
    { key: "phone", label: "Phone Number", icon: Phone },
    { key: "status", label: "Current Status", icon: Tag },
    { key: "designation", label: "Designation", icon: Briefcase },
    { key: "location", label: "Location", icon: MapPin },
    { 
      key: "value", 
      label: "Estimated Value", 
      icon: IndianRupee,
      format: (val) => `₹${Number(val).toLocaleString()}`
    },
    { key: "source", label: "Lead Source", icon: Tag },
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
      format: (date) => new Date(date).toLocaleDateString('en-US', { dateStyle: 'long' })
    },
  ]

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4 text-muted-foreground">Lead / Company</th>
                <th className="px-6 py-4 text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-muted-foreground">Value</th>
                <th className="px-6 py-4 text-muted-foreground">Contact Info</th>
                <th className="px-6 py-4 text-muted-foreground">Assigned To</th>
                <th className="px-6 py-4 text-center text-muted-foreground">Actions</th>
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
                  <tr 
                    key={lead.id} 
                    className="hover:bg-accent/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm group-hover:text-primary transition-colors">{lead.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">{lead.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(lead.status)} className="text-[10px] font-bold">
                        {(lead.status || "New").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground">
                      ₹{Number(lead.value || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-[11px] space-y-0.5">
                        <span className="text-muted-foreground truncate max-w-[150px] italic">{lead.email}</span>
                        <span className="font-medium">{lead.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                          {getAssignedRepName(lead.assignedTo).charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">{getAssignedRepName(lead.assignedTo)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <div className="relative group/action">
                          <select 
                            title="Re-assign Lead"
                            value={lead.assignedTo || ""}
                            onChange={(e) => updateLead(lead.id, { assignedTo: Number(e.target.value) })}
                            className="h-8 w-8 text-transparent bg-transparent focus:text-foreground cursor-pointer absolute opacity-0 z-10"
                            style={{ width: '32px' }}
                          >
                            <option value="" disabled>Re-assign...</option>
                            {salesReps.map(rep => (
                              <option key={rep.id} value={rep.id}>{rep.name || rep.email}</option>
                            ))}
                          </select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
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

      <DetailModal 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)}
        title="Lead"
        data={selectedLead || {}}
        fields={leadFields}
      />
    </>
  )
}

export default LeadTable
