import React, { useState, useEffect } from "react"
import { 
  X, User, Building, Mail, Phone, Calendar, DollarSign, 
  Tag, Info, UploadCloud, FileText, Trash2, Loader2, IndianRupee 
} from "lucide-react"
import { documentsAPI } from "../../services/api"

const DetailModal = ({ isOpen, onClose, title, data, fields }) => {
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)

  const fetchDocs = async () => {
    if (title !== "Lead" || !data?.id) return
    try {
      const res = await documentsAPI.list({ lead: data.id })
      setDocs(Array.isArray(res.data.results) ? res.data.results : Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error("Failed to fetch documents", err)
    }
  }

  useEffect(() => {
    if (isOpen && data?.id && title === "Lead") {
      fetchDocs()
    } else {
      setDocs([])
    }
  }, [isOpen, data, title])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !data?.id) return
    try {
      setUploading(true)
      await documentsAPI.upload(data.id, file)
      fetchDocs()
    } catch (err) {
      alert("Failed to upload document. Please verify format and file size limits.")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return
    try {
      await documentsAPI.delete(docId)
      fetchDocs()
    } catch (err) {
      alert("Failed to delete document.")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{title} Details</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                Full Record View
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-8 overflow-y-auto space-y-10 flex-1">
          {/* General Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {fields.map((field) => (
              <div key={field.key} className="flex flex-col space-y-1.5 group">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {field.icon && <field.icon className="h-3 w-3" />}
                  {field.label}
                </div>
                <div className="text-base font-medium border-b pb-2 group-hover:border-primary/50 transition-colors">
                  {field.format ? field.format(data[field.key]) : (data[field.key] || "—")}
                </div>
              </div>
            ))}
          </div>

          {/* Notes Card */}
          {data.notes && (
            <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-sm italic text-foreground/80 leading-relaxed">
                {data.notes}
              </p>
            </div>
          )}

          {/* Excel metadata custom fields */}
          {data.custom_fields && Object.keys(data.custom_fields).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">Additional Information (from Excel)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {Object.entries(data.custom_fields).map(([key, value]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{key}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Attachment Module for Leads */}
          {title === "Lead" && (
            <div className="space-y-4 border-t pt-8">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Lead profile attachments
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center bg-muted/20 relative">
                  <UploadCloud className="h-8 w-8 text-primary/60 mb-2" />
                  <span className="text-xs font-bold block">Drag & Drop or Choose Files</span>
                  <span className="text-[10px] text-muted-foreground mt-1">Accepts proposal PDFs, spec sheets, Excel matrices</span>
                  
                  <input 
                    type="file" 
                    onChange={handleFileUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2 rounded-xl">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      <span className="text-xs font-bold text-primary">Uploading attachment...</span>
                    </div>
                  )}
                </div>

                {/* Attachments List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Document Library</span>
                  {docs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3">No attachments uploaded for this lead.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {docs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <a 
                              href={doc.file} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="font-semibold text-primary hover:underline truncate max-w-[150px]"
                            >
                              {doc.file_name || "Attachment File"}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] text-muted-foreground font-medium">
                              {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ""}
                            </span>
                            <button 
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t bg-muted/30 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default DetailModal
