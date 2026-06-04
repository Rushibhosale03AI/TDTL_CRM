import React, { useState } from "react"
import { Plus, Download, Filter } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import LeadTable from "./LeadTable"
import LeadForm from "./LeadForm"

const LeadList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)

  const handleOpenAddModal = () => {
    setEditingLead(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (lead) => {
    setEditingLead(lead)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage your potential customers and sales leads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="flex items-center gap-2" onClick={handleOpenAddModal}>
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-sm">
          <Input placeholder="Search name or company..." className="bg-card/50" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <LeadTable onEdit={handleOpenEditModal} />

      <LeadForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingLead={editingLead}
      />
    </div>
  )
}

export default LeadList
