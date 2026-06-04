import React, { useState, useEffect } from "react"
import { X, AlertCircle } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { useLeads } from "../../hooks/useLeads"
import { useAuth } from "../../hooks/useAuth"

const LeadForm = ({ isOpen, onClose, editingLead = null }) => {
  const { leads, createLead, updateLead, error } = useLeads({ skipFetchOnMount: true })
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "New",
    value: "",
    designation: "",
    location: "",
    linkedin_url: "",
  })

  const [duplicateWarning, setDuplicateWarning] = useState("")

  useEffect(() => {
    if (editingLead) {
      setFormData(editingLead)
    } else {
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        status: "New",
        value: "",
        designation: "",
        location: "",
        linkedin_url: "",
      })
    }
  }, [editingLead, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setDuplicateWarning("")
      return
    }
    if (!formData.email && (!formData.name || !formData.phone)) {
      setDuplicateWarning("")
      return
    }

    const isDuplicate = Array.isArray(leads) && leads.some(lead => {
      if (editingLead && lead.id === editingLead.id) return false
      
      const emailMatch = formData.email && lead.email && lead.email.toLowerCase() === formData.email.toLowerCase()
      const namePhoneMatch = formData.name && formData.phone && lead.name && lead.phone && 
                             lead.name.toLowerCase() === formData.name.toLowerCase() && 
                             lead.phone === formData.phone
      return emailMatch || namePhoneMatch
    })

    if (isDuplicate) {
      setDuplicateWarning("Warning: A lead with this email or name/phone combination already exists!")
    } else {
      setDuplicateWarning("")
    }
  }, [formData.email, formData.name, formData.phone, leads, editingLead, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Auto-format LinkedIn URL if scheme is missing
    let formattedLinkedinUrl = formData.linkedin_url ? formData.linkedin_url.trim() : ""
    if (formattedLinkedinUrl && !/^https?:\/\//i.test(formattedLinkedinUrl)) {
      formattedLinkedinUrl = `https://${formattedLinkedinUrl}`
    }

    // Clean up data before sending
    const submissionData = {
      ...formData,
      linkedin_url: formattedLinkedinUrl,
      value: formData.value === "" ? 0 : Number(formData.value),
      assignedTo: user?.id,
    }

    let result
    if (editingLead) {
      result = await updateLead(editingLead.id, submissionData)
    } else {
      result = await createLead(submissionData)
    }
    
    if (result) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card p-6 rounded-xl shadow-lg border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {editingLead ? "Edit Lead" : "Add New Lead"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-destructive text-xs font-bold p-3 rounded-lg flex items-start gap-2 animate-in fade-in duration-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-extrabold uppercase tracking-wider text-[10px]">Validation Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {duplicateWarning && (
            <div className="bg-red-500/10 border border-red-500/20 text-destructive text-xs font-bold p-3 rounded-lg flex items-center gap-2 animate-in fade-in duration-300">
              <span className="h-2 w-2 bg-destructive rounded-full shrink-0 animate-ping" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              required
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Company</label>
            <Input
              required
              placeholder="Acme Corp"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                required
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                placeholder="123-456-7890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="New">New</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Qualified">Qualified</option>
                <option value="Meeting">Meeting</option>
                <option value="Requirements">Requirements</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Est. Value (₹)</label>
              <Input
                type="number"
                placeholder="5000"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Designation</label>
              <Input
                placeholder="Manager / Director"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                placeholder="Mumbai, MH"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">LinkedIn Profile</label>
            <Input
              placeholder="https://linkedin.com/in/..."
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingLead ? "Update Lead" : "Create Lead"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LeadForm
