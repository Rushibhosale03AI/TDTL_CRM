import React from "react"
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
  ExternalLink 
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { useStore } from "../../store/state"

const AccountView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contacts, leads } = useStore()

  const contact = contacts.find((c) => c.id === parseInt(id))
  
  // Find linked deals (leads) that belong to the same company
  const linkedDeals = leads.filter(
    (lead) => lead.company.toLowerCase() === contact?.company.toLowerCase()
  )

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
          <Button variant="outline" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Team
          </Button>
          <Button className="flex items-center gap-2">
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
              <Button variant="ghost" size="sm" className="text-primary text-xs font-bold">Create New Deal</Button>
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

export default AccountView
