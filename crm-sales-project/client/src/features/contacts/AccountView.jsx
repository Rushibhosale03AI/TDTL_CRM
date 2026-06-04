import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Users, 
  CreditCard,
  ExternalLink,
  X,
  Check
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { useContacts } from "../../hooks/useContacts"
import { useLeads } from "../../hooks/useLeads"

const AccountView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contacts, updateContact } = useContacts()
  const { leads, createLead } = useLeads()
  
  // Modal states
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDealModal, setShowDealModal] = useState(false)
  
  // Form states
  const [emailTeam, setEmailTeam] = useState({ subject: '', message: '', recipients: '' })
  const [editForm, setEditForm] = useState({})
  const [dealForm, setDealForm] = useState({
    name: '',
    amount: '',
    stage: 'PROSPECTING',
    probability: 50,
    closeDate: ''
  })
  const [successMessage, setSuccessMessage] = useState('')

  const contact = contacts.find((c) => c.id === parseInt(id))
  
  // Find linked deals (leads) that belong to the same company
  const linkedDeals = leads.filter(
    (lead) => lead.company?.toLowerCase() === contact?.company?.toLowerCase()
  )
  
  // Initialize edit form with contact data
  React.useEffect(() => {
    if (contact && !Object.keys(editForm).length) {
      setEditForm({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        designation: contact.designation || '',
        industry: contact.industry || '',
        location: contact.location || '',
        website: contact.website || '',
        size: contact.size || ''
      })
    }
  }, [contact, editForm])

  const handleEmailTeam = () => {
    console.log('Email Team:', emailTeam)
    setSuccessMessage('Email sent successfully!')
    setTimeout(() => {
      setShowEmailModal(false)
      setSuccessMessage('')
      setEmailTeam({ subject: '', message: '', recipients: '' })
    }, 1500)
  }

  const handleEditAccount = async () => {
    console.log('Updated Account:', editForm)
    setSuccessMessage('Account updated successfully!')
    setTimeout(() => {
      setShowEditModal(false)
      setSuccessMessage('')
    }, 1500)
  }

  const handleCreateDeal = async () => {
    const newDeal = {
      id: Math.max(...leads.map(l => l.id), 0) + 1,
      name: dealForm.name,
      company: contact.company,
      value: parseFloat(dealForm.amount),
      stage: dealForm.stage,
      probability: dealForm.probability,
      close_date: dealForm.closeDate,
      owner: 1,
      status: 'Yet to approach'
    }
    console.log('Created Deal:', newDeal)
    setSuccessMessage('Deal created successfully!')
    setTimeout(() => {
      setShowDealModal(false)
      setSuccessMessage('')
      setDealForm({ name: '', amount: '', stage: 'PROSPECTING', probability: 50, closeDate: '' })
    }, 1500)
  }

  if (!contact) {
    return <div className="p-8 text-center text-muted-foreground">Contact not found.</div>
  }

  const sections = [
    { label: "Account Size", value: contact.size, icon: Users },
    { label: "Industry", value: contact.industry, icon: Building2 },
    { label: "Website", value: contact.website, icon: Globe },
    { label: "Last Interaction", value: contact.lastContacted, icon: CalendarIcon },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/contacts")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{contact.company}</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Active Customer</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Primary Contact: {contact.name}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowEmailModal(true)}
          >
            <Mail className="h-4 w-4" />
            Email Team
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowEditModal(true)}
          >
            Edit Account
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Account Info Column */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Account Details</h3>
            <div className="space-y-4">
              <DetailItem label="Industry" value={contact.industry} icon={Building2} />
              <DetailItem label="Account Size" value={contact.size} icon={Users} />
              <DetailItem label="Website" value={contact.website} icon={Globe} link={`https://${contact.website}`} />
              <DetailItem label="Phone" value={contact.phone} icon={Phone} />
              <DetailItem label="Location" value="New York, USA" icon={MapPin} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-primary">Key Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">{linkedDeals.length}</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Deals</div>
              </div>
              <div className="p-3 bg-green-500/5 rounded-lg">
                <div className="text-2xl font-bold text-green-600">$124k</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Lifetime Rev</div>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Deals Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="border-b px-6 py-4 flex items-center justify-between bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Associated Opportunities
              </h3>
              <Button variant="ghost" size="sm" className="text-primary text-xs font-bold" onClick={() => setShowDealModal(true)}>Create New Deal</Button>
            </div>
            <div className="divide-y">
              {linkedDeals.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic">No deals found for this account.</div>
              ) : (
                linkedDeals.map((deal) => (
                  <div key={deal.id} className="p-4 hover:bg-accent/50 transition-colors flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{deal.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{deal.company} • Added {deal.date}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-bold">${Number(deal.value).toLocaleString()}</div>
                        <Badge className="text-[9px] h-4 py-0" variant={deal.status === 'Won' ? 'success' : 'secondary'}>
                          {deal.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Contact History</h3>
            <div className="space-y-6">
              <TimelineItem 
                title="Q2 Service Review Completed" 
                date="Mar 25, 2024" 
                desc="Discussed expansion of current license to include 15 more seats." 
              />
              <TimelineItem 
                title="Support Ticket Closed" 
                date="Mar 12, 2024" 
                desc="Resolved technical issue regarding API authentication." 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Email Team Modal */}
      {showEmailModal && (
        <Modal title="Email Team" onClose={() => setShowEmailModal(false)}>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Recipients (comma-separated emails)"
              value={emailTeam.recipients}
              onChange={(e) => setEmailTeam({ ...emailTeam, recipients: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="text"
              placeholder="Subject"
              value={emailTeam.subject}
              onChange={(e) => setEmailTeam({ ...emailTeam, subject: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <textarea
              placeholder="Message"
              value={emailTeam.message}
              onChange={(e) => setEmailTeam({ ...emailTeam, message: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>Cancel</Button>
              <Button onClick={handleEmailTeam} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Account Modal */}
      {showEditModal && (
        <Modal title="Edit Account" onClose={() => setShowEditModal(false)}>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <input
              type="text"
              placeholder="Contact Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="email"
              placeholder="Email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="text"
              placeholder="Phone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="text"
              placeholder="Company"
              value={editForm.company}
              onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="text"
              placeholder="Designation"
              value={editForm.designation}
              onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="text"
              placeholder="Industry"
              value={editForm.industry}
              onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="text"
              placeholder="Location"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="text"
              placeholder="Website"
              value={editForm.website}
              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="text"
              placeholder="Account Size"
              value={editForm.size}
              onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={handleEditAccount} className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Deal Modal */}
      {showDealModal && (
        <Modal title="Create New Deal" onClose={() => setShowDealModal(false)}>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Deal Name"
              value={dealForm.name}
              onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="number"
              placeholder="Deal Amount"
              value={dealForm.amount}
              onChange={(e) => setDealForm({ ...dealForm, amount: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <select
              value={dealForm.stage}
              onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="PROSPECTING">Prospecting</option>
              <option value="PROPOSAL">Proposal</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="CLOSED_WON">Closed Won</option>
              <option value="CLOSED_LOST">Closed Lost</option>
            </select>
            <div>
              <label className="text-sm font-medium mb-2 block">Probability (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={dealForm.probability}
                onChange={(e) => setDealForm({ ...dealForm, probability: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground mt-1">{dealForm.probability}%</div>
            </div>
            <input
              type="date"
              value={dealForm.closeDate}
              onChange={(e) => setDealForm({ ...dealForm, closeDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDealModal(false)}>Cancel</Button>
              <Button onClick={handleCreateDeal} className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Create Deal
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          {successMessage}
        </div>
      )}
    </div>
  )
}

const DetailItem = ({ label, value, icon: Icon, link }) => (
  <div className="flex justify-between items-start">
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <Icon className="h-4 w-4 stroke-[1.5px]" />
      <span>{label}</span>
    </div>
    {link ? (
      <a href={link} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
        {value} <ExternalLink className="h-3 w-3" />
      </a>
    ) : (
      <span className="text-sm font-medium text-foreground">{value}</span>
    )}
  </div>
)

const TimelineItem = ({ title, date, desc }) => (
  <div className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:h-2 before:w-2 before:rounded-full before:bg-primary">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
      <h4 className="text-sm font-semibold">{title}</h4>
      <span className="text-[10px] font-bold text-muted-foreground uppercase">{date}</span>
    </div>
    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
  </div>
)

const CalendarIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </svg>
)

// Modal Component
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
    <div className="bg-card rounded-xl border shadow-lg w-full max-w-md animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between border-b p-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

export default AccountView
