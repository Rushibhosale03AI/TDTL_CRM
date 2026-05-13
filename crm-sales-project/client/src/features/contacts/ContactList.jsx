import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Building2, User, Mail, Phone, ChevronRight, UserPlus } from "lucide-react"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { useStore } from "../../store/state"
import { useAuth } from "../../hooks/useAuth"

const ContactList = () => {
  const navigate = useNavigate()
  const { contacts, updateContact, mockUsers } = useStore()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  
  const salesReps = mockUsers.filter(u => u.role === 'sales')

  // Base contacts based on role
  const baseContacts = user?.role === 'sales'
    ? contacts.filter(c => c.assignedTo === user.id)
    : contacts

  const filteredContacts = baseContacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const getAssignedRepName = (id) => {
    const rep = mockUsers.find(u => u.id === id)
    return rep ? rep.name : "Unassigned"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your qualified customers and key accounts.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name, company, or industry..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContacts.map((contact) => (
          <div 
            key={contact.id}
            className="group relative rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div 
              className="absolute inset-0 cursor-pointer z-0" 
              onClick={() => navigate(`/contacts/${contact.id}`)}
            />
            
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {contact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {contact.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {contact.company}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </div>

            <div className="relative z-10 mt-4 grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span className="truncate">{contact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>{contact.phone}</span>
              </div>
            </div>

            <div className="relative z-10 mt-4 flex items-center justify-between border-t border-border/50 pt-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                  {contact.industry}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 group/assign">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary/50"></span>
                  {getAssignedRepName(contact.assignedTo)}
                </div>
                <div className="relative flex items-center justify-center h-6 w-6">
                  <select 
                    title="Re-assign Contact"
                    value={contact.assignedTo || ""}
                    onChange={(e) => updateContact(contact.id, { assignedTo: Number(e.target.value) })}
                    className="h-6 w-6 text-transparent bg-transparent focus:text-foreground cursor-pointer absolute opacity-0 z-20"
                  >
                    <option value="" disabled>Re-assign...</option>
                    {salesReps.map(rep => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 group-hover/assign:opacity-100 transition-opacity absolute pointer-events-none z-10">
                    <UserPlus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredContacts.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-muted-foreground italic">No contacts found matching your search.</p>
        </div>
      )}
    </div>
  )
}

export default ContactList
