import React, { useState } from "react"
import { X } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { useContacts } from "../../hooks/useContacts"
import { useAuth } from "../../hooks/useAuth"

const ContactForm = ({ isOpen, onClose }) => {
  const { createContact } = useContacts()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    industry: "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createContact({
      ...formData,
      owner: user?.id,
    })
    setFormData({ name: "", company: "", email: "", phone: "", industry: "" })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card p-6 rounded-xl shadow-lg border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add New Contact</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Contact Name</label>
            <Input
              required
              placeholder="e.g. Tony Stark"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Company</label>
            <Input
              required
              placeholder="e.g. Stark Industries"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                required
                placeholder="tony@stark.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <Input
                placeholder="555-0198"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Industry</label>
            <Input
              placeholder="e.g. Technology"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Contact
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContactForm
