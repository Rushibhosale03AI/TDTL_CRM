import React, { useState } from "react"
import { Plus, Download, Filter, LayoutGrid, List, Calendar, CheckCircle2, Loader2, FileSpreadsheet, X } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import LeadTable from "./LeadTable"
import LeadSpreadsheetView from "./LeadSpreadsheetView"
import LeadForm from "./LeadForm"
import ExcelImport from "./ExcelImport"
import { useLeads } from "../../hooks/useLeads"
import api, { leadsAPI } from "../../services/api"

const LeadList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [viewMode, setViewMode] = useState("spreadsheet") // Defaults directly to editable Excel Spreadsheet mode!

  const { leads, fetchLeads, loading, pagination, setFilters, waitForPendingRequests } = useLeads()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState("-created_at")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    fetchLeads({ page: newPage, ordering: sortOrder, status: statusFilter, search: searchTerm })
  }

  const handleSortChange = (e) => {
    const val = e.target.value
    setSortOrder(val)
    setCurrentPage(1)
    fetchLeads({ page: 1, ordering: val, status: statusFilter, search: searchTerm })
  }

  const handleStatusChange = (e) => {
    const val = e.target.value
    setStatusFilter(val)
    setCurrentPage(1)
    fetchLeads({ page: 1, ordering: sortOrder, status: val, search: searchTerm })
  }

  const handleSearch = (e) => {
    const val = e.target.value
    setSearchTerm(val)
    // Debounce search if needed, but for now direct
    if (val.length > 2 || val.length === 0) {
      setCurrentPage(1)
      fetchLeads({ page: 1, ordering: sortOrder, status: statusFilter, search: val })
    }
  }

  const handleOpenAddModal = () => {
    setEditingLead(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (lead) => {
    setEditingLead(lead)
    setIsModalOpen(true)
  }

  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false)
  const [exportScope, setExportScope] = useState("filtered") // Defaults to current filtered results export
  const [exporting, setExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())

  const handleExportClick = () => {
    setIsExportConfirmOpen(true)
  }

  const flushActiveEdit = async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  const executeExport = async () => {
    setExporting(true)
    setExportSuccess(false)
    try {
      await flushActiveEdit()
      await waitForPendingRequests()
      await fetchLeads({ ordering: sortOrder, status: statusFilter, search: searchTerm })

      let response
      if (exportScope === "all") {
        response = await leadsAPI.exportExcel({ export_all: "true" })
      } else {
        response = await leadsAPI.exportExcel({
          ordering: sortOrder,
          status: statusFilter,
          search: searchTerm
        })
      }
      
      const contentType = response.headers['content-type'] || ''
      const exportedCount = response.headers['x-exported-count'] || '0'

      if (contentType.includes('application/json') || contentType.includes('text/plain')) {
        const text = await new Response(response.data).text()
        let json
        try {
          json = JSON.parse(text)
        } catch (_err) {
          json = { error: text }
        }
        console.error('Export returned error payload:', json)
        alert(`Export failed:\n${json.error || json.detail || 'Unexpected response from server.'}`)
        return
      }

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const filename = `leads_export_${exportedCount}_${new Date().toISOString().split('T')[0]}.xlsx`
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      if (exportedCount === '0') {
        alert('Export completed but no rows were found for the selected filters. Please adjust filters or confirm there are saved leads before exporting.')
      } else {
        setExportSuccess(true)
        setLastSyncTime(new Date())
        setTimeout(() => {
          setIsExportConfirmOpen(false)
          setExportSuccess(false)
        }, 1800)
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export leads. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Leads Management
            <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              v2.0-Optimistic
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage your potential customers and sales leads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* High-quality toggle switcher */}
          <div className="flex items-center border rounded-lg overflow-hidden bg-background p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode("spreadsheet")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black transition-all ${
                viewMode === "spreadsheet" 
                  ? "bg-primary text-primary-foreground rounded-md shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Switch to editable Excel grid mode"
            >
              <LayoutGrid size={13} />
              Spreadsheet Mode
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black transition-all ${
                viewMode === "table" 
                  ? "bg-primary text-primary-foreground rounded-md shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Switch to standard list table"
            >
              <List size={13} />
              List Table Mode
            </button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchLeads()} 
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsImportOpen(true)}
          >
            <Download className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleExportClick}
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
          <Button className="flex items-center gap-2" onClick={handleOpenAddModal}>
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/40 p-4 rounded-xl border border-dashed">
        <div className="flex-1 max-w-sm">
          <Input 
            placeholder="Search leads..." 
            className="bg-background" 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-muted-foreground">Sort:</span>
            <select 
              className="bg-background border rounded-md px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={sortOrder}
              onChange={handleSortChange}
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
              <option value="-value">Value (High to Low)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-muted-foreground">Status:</span>
            <select 
              className="bg-background border rounded-md px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="">All Statuses</option>
              <option value="Yet to approach">Yet to approach</option>
              <option value="In process">In process</option>
              <option value="Completed">Completed</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === "spreadsheet" ? (
        <LeadSpreadsheetView leads={leads} loading={loading} />
      ) : (
        <LeadTable onEdit={handleOpenEditModal} leads={leads} />
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-4 bg-card/30 border-t rounded-b-xl mt-4">
        <p className="text-sm text-muted-foreground font-medium">
          Total: <span className="text-foreground font-bold">{pagination?.count || 0}</span> Leads
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination?.previous || loading}
            onClick={() => handlePageChange(currentPage - 1)}
            className="h-9 px-4 font-bold"
          >
            Previous
          </Button>
          <div className="h-9 px-4 flex items-center justify-center bg-background border rounded-md text-sm font-black">
            {currentPage}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination?.next || loading}
            onClick={() => handlePageChange(currentPage + 1)}
            className="h-9 px-4 font-bold"
          >
            Next
          </Button>
        </div>
      </div>

      <LeadForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        lead={editingLead}
      />

      <ExcelImport 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onSuccess={() => setViewMode("spreadsheet")}
      />

      {/* Export Configuration & Confirmation Modal */}
      {isExportConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 bg-card border border-border/80 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <button 
              onClick={() => setIsExportConfirmOpen(false)}
              className="absolute right-4 top-4 p-1 bg-accent/20 hover:bg-accent/40 rounded-full text-muted-foreground hover:text-foreground transition-all"
            >
              <X size={16} />
            </button>
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="p-3.5 bg-emerald-500/10 rounded-full text-emerald-400">
                <FileSpreadsheet size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Configure Excel Export</h3>
                <p className="text-xs text-muted-foreground">Select scope and filter options to download daily activity trackers.</p>
              </div>

              {/* Scope selectors */}
              <div className="w-full space-y-2 mt-2">
                <button
                  onClick={() => setExportScope("filtered")}
                  className={`w-full p-3.5 border rounded-xl flex items-center justify-between text-left transition-all ${
                    exportScope === "filtered" 
                      ? "border-primary bg-primary/5 text-primary shadow-sm" 
                      : "border-border/60 hover:bg-accent/10 text-foreground"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Export Filtered Search</p>
                    <p className="text-[10px] text-muted-foreground">Exports active filters and query lists ({pagination?.count || 0} items)</p>
                  </div>
                  <span className="h-4 w-4 rounded-full border border-primary flex items-center justify-center flex-shrink-0">
                    {exportScope === "filtered" && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                </button>

                <button
                  onClick={() => setExportScope("all")}
                  className={`w-full p-3.5 border rounded-xl flex items-center justify-between text-left transition-all ${
                    exportScope === "all" 
                      ? "border-primary bg-primary/5 text-primary shadow-sm" 
                      : "border-border/60 hover:bg-accent/10 text-foreground"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Full Database Backup (Complete Sheet)</p>
                    <p className="text-[10px] text-muted-foreground">Includes all historical imports, CRM leads & daily responses.</p>
                  </div>
                  <span className="h-4 w-4 rounded-full border border-primary flex items-center justify-center flex-shrink-0">
                    {exportScope === "all" && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                </button>
              </div>

              {/* Last Sync Timestamp */}
              <div className="w-full bg-muted/30 p-2.5 rounded-lg border border-border/20 flex justify-between items-center text-xs text-left">
                <span className="text-muted-foreground">Last Database Sync:</span>
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Calendar size={12} className="text-primary" />
                  {lastSyncTime.toLocaleTimeString()}
                </span>
              </div>

              {/* Status alerts */}
              {exportSuccess && (
                <div className="w-full p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-500 text-left animate-in slide-in-from-top-1">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <p className="text-xs font-bold">Spreadsheet exported successfully!</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex w-full gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsExportConfirmOpen(false)} disabled={exporting}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={executeExport} 
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    "Download Excel"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadList
