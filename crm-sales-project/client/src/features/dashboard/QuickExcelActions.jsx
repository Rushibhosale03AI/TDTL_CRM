import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileUp, FileDown, Layers, Loader2, CheckCircle2, Calendar, RefreshCw } from "lucide-react"
import { Button } from "../../components/ui/Button"
import ExcelImport from "../leads/ExcelImport"
import { leadsAPI } from "../../services/api"
import { useLeads } from "../../hooks/useLeads"

const QuickExcelActions = ({ showAdminControls = false }) => {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())
  const { fetchLeads, waitForPendingRequests } = useLeads()
  const navigate = useNavigate()

  const flushActiveEdit = async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  const handleExportAll = async () => {
    setExporting(true)
    setExportSuccess(false)
    try {
      await flushActiveEdit()
      await waitForPendingRequests()
      await fetchLeads()

      const response = await leadsAPI.exportExcel({ export_all: "true" })
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
      const filename = `full_crm_export_${exportedCount}_${new Date().toISOString().split('T')[0]}.xlsx`
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      if (exportedCount === '0') {
        alert('Export completed but no rows were found. Please confirm data exists for your account or filters and try again.')
      } else {
        setExportSuccess(true)
        setLastSyncTime(new Date())
        setTimeout(() => setExportSuccess(false), 3000)
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export data. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const handleRefresh = async () => {
    await fetchLeads()
    setLastSyncTime(new Date())
  }

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm mb-8 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Excel Data Hub</h3>
          </div>
          <p className="text-muted-foreground text-xs font-medium">Manage your leads and data via bulk Excel operations.</p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
            <Calendar size={11} className="text-primary" />
            <span>Last synced: <span className="font-bold text-foreground">{lastSyncTime.toLocaleTimeString()}</span></span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="ghost"
            size="sm" 
            className="h-10 text-xs font-bold gap-2 px-3"
            onClick={handleRefresh}
            title="Refresh leads list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 text-xs font-bold gap-2 px-4"
            onClick={() => setIsImportOpen(true)}
          >
            <FileUp className="h-4 w-4" />
            Bulk Import
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            className="h-10 text-xs font-bold gap-2 px-4 shadow-lg shadow-primary/20"
            onClick={handleExportAll}
            disabled={exporting}
          >
            {exporting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</>
            ) : (
              <><FileDown className="h-4 w-4" /> Export All</>
            )}
          </Button>
        </div>
      </div>

      {/* Success Banner */}
      {exportSuccess && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-500 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 size={15} className="flex-shrink-0" />
          <p className="text-xs font-bold">Full database exported successfully! Check your downloads folder.</p>
        </div>
      )}

      <ExcelImport 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onSuccess={() => {
          navigate('/leads')
        }}
      />
    </div>
  )
}

export default QuickExcelActions
