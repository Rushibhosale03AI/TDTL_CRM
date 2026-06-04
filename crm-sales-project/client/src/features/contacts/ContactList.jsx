import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Building2, User, Mail, Phone, ChevronRight, UserPlus, Tag, Briefcase, Globe, Info } from "lucide-react"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import DetailModal from "../../components/ui/DetailModal"
import { useContacts } from "../../hooks/useContacts"
import { useAuth } from "../../hooks/useAuth"
import { useUsers } from "../../hooks/useUsers"
import ContactForm from "./ContactForm"

const ContactList = () => {
  const navigate = useNavigate()
  const { contacts, updateContact } = useContacts()
  const { user } = useAuth()
  const { users } = useUsers()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  
  const safeUsers = Array.isArray(users) ? users : []
  const salesReps = safeUsers.filter(u => u.role === 'sales' || u.role === 'SALES')

  const baseContacts = Array.isArray(contacts) ? contacts : []

  const filteredContacts = baseContacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.industry && contact.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  
  const getAssignedRepName = (id) => {
    const rep = safeUsers.find(u => u.id === id)
    return rep ? rep.name : "Unassigned"
  }

  const contactFields = [
    { key: "name", label: "Full Name", icon: User },
    { key: "company", label: "Company", icon: Building2 },
    { key: "industry", label: "Industry", icon: Briefcase },
    { key: "email", label: "Email Address", icon: Mail },
    { key: "phone", label: "Phone Number", icon: Phone },
    { key: "website", label: "Website", icon: Globe },
    { 
      key: "assignedTo", 
      label: "Account Manager", 
      icon: User,
      format: (id) => getAssignedRepName(id)
    },
    { key: "notes", label: "Additional Info", icon: Info },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Key Contacts</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage your high-value customers and account stakeholders.
          </p>
        </div>
        <Button className="flex items-center gap-2 font-bold px-6 h-11 bg-primary shadow-lg shadow-primary/20" onClick={() => setIsModalOpen(true)}>
          <User className="h-5 w-5" />
          Add New Contact
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search contacts, companies, or industries..." 
            className="pl-10 h-10 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-[10px] uppercase tracking-widest font-black text-muted-foreground">
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5">Industry</th>
                <th className="px-6 py-5">Email & Phone</th>
                <th className="px-6 py-5">Managed By</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-muted-foreground italic">
                    {searchQuery ? "No contacts match your search." : "No contacts found. Start by adding one!"}
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className="hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black border border-primary/10">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm group-hover:text-primary transition-colors">{contact.name}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black">
                            <Building2 className="h-3 w-3" />
                            {contact.company}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-[9px] font-black tracking-wider px-2 py-0.5 bg-secondary/30 text-secondary-foreground border-none">
                        {contact.industry ? contact.industry.toUpperCase() : "GENERAL"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Mail className="h-3 w-3 text-primary/60" />
                          {contact.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                          <Phone className="h-3 w-3 text-primary/60" />
                          {contact.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[9px] font-black">
                          {getAssignedRepName(contact.assignedTo).charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">{getAssignedRepName(contact.assignedTo)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2 group/action">
                        <select 
                          title="Re-assign Contact"
                          value={contact.assignedTo || ""}
                          onChange={(e) => updateContact(contact.id, { assignedTo: Number(e.target.value) || null })}
                          className="px-3 py-1.5 text-sm font-bold bg-muted/60 border border-border/30 rounded-lg cursor-pointer focus:ring-1 focus:ring-primary/20 text-foreground hover:bg-muted/80 transition-all"
                        >
                          <option value="">Unassigned</option>
                          {salesReps.map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.name || rep.email}</option>
                          ))}
                        </select>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
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
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title="Contact"
        data={selectedContact || {}}
        fields={contactFields}
      />
      
      <ContactForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default ContactList
