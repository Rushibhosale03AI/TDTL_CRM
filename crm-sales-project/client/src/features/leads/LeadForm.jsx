import React, { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { useStore } from "../../store/state"

const LeadForm = ({ isOpen, onClose, editingLead = null }) => {
  const { addLead, updateLead } = useStore()
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "New",
    value: "",
  })

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
      })
    }
  }, [editingLead, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingLead) {
      updateLead(editingLead.id, formData)
    } else {
      addLead({
        ...formData,
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
      })
    }
    onClose()
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
              <label className="text-sm font-medium">Est. Value ($)</label>
              <Input
                type="number"
                placeholder="5000"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
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
