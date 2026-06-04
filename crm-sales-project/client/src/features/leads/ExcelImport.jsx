import React, { useState, useEffect, useRef } from "react"
import { FileUp, Loader2, CheckCircle2, AlertCircle, X, Download, History, Database, Calendar, User, Info, FileSpreadsheet, ShieldAlert } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { leadsAPI, importsAPI } from "../../services/api"
import { useLeads } from "../../hooks/useLeads"

const ExcelImport = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("upload") // "upload" | "history"
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState("")
  const [importSummary, setImportSummary] = useState(null)
  const [importHistory, setImportHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const fileInputRef = useRef(null)
  const { fetchLeads } = useLeads()

  // Load history when history tab is active
  useEffect(() => {
    if (isOpen && activeTab === "history") {
      loadHistory()
    }
  }, [isOpen, activeTab])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await importsAPI.list()
      setImportHistory(response.data.results || response.data || [])
    } catch (error) {
      console.error("Failed to load import history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const validFiles = selectedFiles.filter(f => f.name.endsWith('.xlsx'))
    
    if (validFiles.length > 0) {
      setFiles(validFiles)
      setStatus(null)
      setMessage("")
      setImportSummary(null)
    } else {
      setStatus("error")
      setMessage("Please select valid .xlsx spreadsheet files.")
      setFiles([])
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await leadsAPI.downloadTemplate()
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'tdtl_leads_template.xlsx')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Template download failed:", error)
      setStatus("error")
      setMessage("Failed to download Excel template.")
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setStatus(null)
    setImportSummary(null)
    let jobs = []

    try {
      for (const file of files) {
        const response = await leadsAPI.importExcel(file)
        if (response.data) {
          jobs.push(response.data)
        }
      }

      setStatus("success")
      setMessage("Import processed successfully!")
      setActiveTab("history")

      // Parse import summary from response payload
      if (jobs.length > 0) {
        const latestJob = jobs[jobs.length - 1]
        setImportSummary({
          total: latestJob.summary?.total || 0,
          created: latestJob.summary?.created_count || 0,
          updated: latestJob.summary?.updated_count || 0,
          duplicates: latestJob.summary?.duplicate_count || 0,
          failed: latestJob.summary?.failure_count || 0,
          skipped: latestJob.summary?.skipped_count || 0,
          errors: latestJob.summary?.errors || []
        })
      }

      await fetchLeads()
      setFiles([])
      if (typeof onSuccess === "function") {
        onSuccess()
      }
      onClose()
    } catch (error) {
      console.error("Import failed:", error)
      setStatus("error")
      setMessage("Failed to process Excel spreadsheet. Please ensure columns conform to template.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl p-6 bg-card border border-border/80 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto scrollbar-thin">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Excel Record Manager</h2>
              <p className="text-xs text-muted-foreground">Import and preserve your historical daily records</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 bg-accent/20 hover:bg-accent/40 rounded-full text-muted-foreground hover:text-foreground transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4 bg-muted/30 p-1 rounded-lg border border-border/20">
          <button
            onClick={() => { setActiveTab("upload"); setStatus(null); setImportSummary(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === "upload" 
                ? "bg-card text-foreground shadow-md border border-border/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-card/30"
            }`}
          >
            <FileUp size={14} /> Upload Daily Sheet
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === "history" 
                ? "bg-card text-foreground shadow-md border border-border/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-card/30"
            }`}
          >
            <History size={14} /> View Import Logs
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "upload" ? (
          <div className="space-y-6 pt-4">
            
            {/* Template Card */}
            <div className="flex justify-between items-center bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-4 rounded-xl border border-emerald-500/10 text-left">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">Standard Excel Template</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Includes standardized status & outcome dropdown options</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="h-8 text-xs gap-2 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-400">
                <Download size={14} /> Template
              </Button>
            </div>

            {/* Drag & Drop File Selector */}
            <div 
              className={`w-full p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                files.length > 0 ? "border-primary bg-primary/5 shadow-inner" : "border-border/60 hover:border-primary/50 hover:bg-accent/10"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
                multiple
              />
              <FileUp className={`h-10 w-10 ${files.length > 0 ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-center">
                {files.length > 0 ? (
                  <>
                    <p className="text-sm font-bold text-foreground">{files.length} spreadsheet(s) ready</p>
                    <p className="text-xs text-primary font-semibold mt-1">Click to substitute file selection</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-foreground">Drag & drop your Excel sheet here</p>
                    <p className="text-xs text-muted-foreground mt-1">Accepts standard .xlsx daily files</p>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {status === "error" && (
              <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="flex-shrink-0" />
                <p className="text-xs font-semibold">{message}</p>
              </div>
            )}

            {/* Success Summary Audit Panel */}
            {status === "success" && importSummary && (
              <div className="space-y-4 animate-in slide-in-from-top-3 duration-300">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 size={16} />
                  <p className="text-xs font-black uppercase tracking-wider">{message}</p>
                </div>

                {/* Audit numbers cards */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl text-center">
                    <p className="text-xl font-black text-primary">{importSummary.total}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Processed</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-center">
                    <p className="text-xl font-black text-emerald-400">{importSummary.created}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Newly Added</p>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-center">
                    <p className="text-xl font-black text-amber-400">{importSummary.duplicates}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Matched/Merged</p>
                  </div>
                  <div className="bg-destructive/5 border border-destructive/10 p-3 rounded-xl text-center">
                    <p className="text-xl font-black text-destructive">{importSummary.failed}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Bad Rows</p>
                  </div>
                </div>
                {importSummary.skipped > 0 && (
                  <div className="p-2.5 bg-muted/20 border border-border/30 rounded-lg flex items-center gap-2 text-muted-foreground text-left">
                    <Info size={13} className="flex-shrink-0" />
                    <p className="text-[10px] font-semibold">
                      {importSummary.skipped} empty row(s) were skipped (no name or email).
                    </p>
                  </div>
                )}

                {/* Safe Overwrite Warning */}
                {importSummary.duplicates > 0 && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-2.5 items-start text-amber-400 text-left">
                    <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-300">Duplicate Matching Safe Overwrite Warning</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                        Matched {importSummary.duplicates} leads with existing records. Values were merged non-destructively without losing your existing database items.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Log Accordion */}
                {importSummary.failed > 0 && (
                  <div className="border border-destructive/20 rounded-xl overflow-hidden bg-destructive/5 text-left">
                    <div className="bg-destructive/10 px-3 py-2 border-b border-destructive/10 flex justify-between items-center">
                      <p className="text-[10px] font-black text-destructive uppercase tracking-widest">Failed Row Analysis</p>
                      <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-bold">{importSummary.failed} Rows</span>
                    </div>
                    <div className="p-3 max-h-36 overflow-y-auto text-xs space-y-1.5 scrollbar-thin">
                      {importSummary.errors.map((err, i) => (
                        <p key={i} className="text-muted-foreground">
                          ⚠️ <span className="font-bold text-destructive">Row {err.row}:</span> {err.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex w-full gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={uploading}>
                Close
              </Button>
              <Button 
                className="flex-1 gap-2" 
                onClick={handleUpload} 
                disabled={files.length === 0 || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Pipeline...
                  </>
                ) : (
                  "Start Import"
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* History Logs Tab Content */
          <div className="pt-4 space-y-4">
            {loadingHistory ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Fetching past pipeline sheets...</p>
              </div>
            ) : importHistory.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border rounded-xl">
                <History size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">No Excel import history found</p>
                <p className="text-xs text-muted-foreground mt-0.5">Past uploaded records will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
                {importHistory.map((job) => {
                  const summary = job.summary || {}
                  const errors = summary.errors || []
                  
                  return (
                    <div key={job.id} className="p-4 bg-muted/20 border border-border/40 rounded-xl hover:bg-muted/40 transition-colors text-left space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            <FileSpreadsheet size={15} className="text-primary" />
                            {job.filename}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(job.created_at).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <User size={11} />
                              {job.uploaded_by_name || job.uploaded_by_email || `User #${job.uploaded_by}`}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          job.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" :
                          job.status === "FAILED" ? "bg-destructive/10 text-destructive" :
                          "bg-amber-500/10 text-amber-500"
                        }`}>
                          {job.status}
                        </span>
                      </div>

                      {/* Job summary metrics */}
                      {job.status === "COMPLETED" && (
                        <div className="grid grid-cols-4 gap-2 bg-card/40 border border-border/10 p-2 rounded-lg text-center">
                          <div>
                            <p className="text-xs font-black text-foreground">{summary.total || 0}</p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Processed</p>
                          </div>
                          <div>
                            <p className="text-xs font-black text-emerald-400">{summary.created_count || 0}</p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Added</p>
                          </div>
                          <div>
                            <p className="text-xs font-black text-amber-400">{summary.duplicate_count || 0}</p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Merged</p>
                          </div>
                          <div>
                            <p className="text-xs font-black text-destructive">{summary.failure_count || 0}</p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Failed</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExcelImport
