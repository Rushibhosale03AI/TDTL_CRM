import React, { useState, useEffect, useRef } from "react"
import { Trash2, Plus, RefreshCw, Loader2 } from "lucide-react"
import { useLeads } from "../../hooks/useLeads"
import { useUsers } from "../../hooks/useUsers"

const LeadSpreadsheetView = ({ leads, loading }) => {
  const { fetchLeads, error, createLead, updateLead, deleteLead } = useLeads({ skipFetchOnMount: true })
  const { users } = useUsers()
  const safeUsers = Array.isArray(users) ? users : []
  const filteredLeads = Array.isArray(leads) ? leads : []

  // Local state for optimistic rows
  const [optimisticLeads, setOptimisticLeads] = useState([])
  const allLeads = [...optimisticLeads, ...filteredLeads]

  // Local state for buffered inputs so typing is instantaneous
  const [localValues, setLocalValues] = useState({})
  
  // Ref to always access the latest localValues in async closures
  const localValuesRef = useRef(localValues)
  useEffect(() => {
    localValuesRef.current = localValues
  }, [localValues])
  
  // Tracks row saving states: { [leadId]: 'saving' | 'saved' | 'error' }
  const [savingStates, setSavingStates] = useState({})
  const [addingRow, setAddingRow] = useState(false)

  // Background refresh to keep view current (only if the user isn't actively editing)
  useEffect(() => {
    const interval = setInterval(() => {
      const isUserEditing = Object.keys(savingStates).some(k => savingStates[k] === 'saving')
      if (!loading && !isUserEditing) {
        fetchLeads()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchLeads, loading, savingStates])

  // Handle local typing / selection changes
  const handleFieldChange = (leadId, field, value) => {
    setLocalValues(prev => ({
      ...prev,
      [`${leadId}-${field}`]: value
    }))
  }

  // Save cell on Blur (for text/date inputs) or on direct Change (for dropdowns)
  const handleSaveField = async (lead, field, value) => {
    const isCustom = [
      "Meeting Date",
      "Outcome (Qualified / Not Qualified / Follow-up)",
      "Demo Call",
      "Proposal Sent",
      "Closures"
    ].includes(field)

    let originalValue
    if (isCustom) {
      originalValue = (lead.custom_fields || {})[field] || ""
    } else {
      if (field === "assignedTo") {
        originalValue = lead.owner?.id || ""
      } else if (field === "linkedin") {
        originalValue = lead.linkedin_url || ""
      } else {
        originalValue = lead[field] || ""
      }
    }

    // Don't save if there is no change
    const normOriginal = String(originalValue ?? "").trim()
    const normNew = String(value ?? "").trim()
    if (normOriginal === normNew) {
      return
    }

    // Set row saving state
    setSavingStates(prev => ({ ...prev, [lead.id]: 'saving' }))

    // Build the request payload
    let patchData = {}
    if (isCustom) {
      patchData = {
        custom_fields: {
          ...(lead.custom_fields || {}),
          [field]: value
        }
      }
    } else {
      if (field === "assignedTo") {
        patchData = { assignedTo: value ? Number(value) : null }
      } else if (field === "linkedin") {
        patchData = { linkedin_url: value }
      } else {
        patchData = { [field]: value }
      }
    }

    try {
      const result = await updateLead(lead.id, patchData)
      if (result) {
        setSavingStates(prev => ({ ...prev, [lead.id]: 'saved' }))
        setTimeout(() => {
          setSavingStates(prev => {
            const copy = { ...prev }
            if (copy[lead.id] === 'saved') {
              delete copy[lead.id]
            }
            return copy
          })
        }, 2000)
      } else {
        setSavingStates(prev => ({ ...prev, [lead.id]: 'error' }))
      }
    } catch (err) {
      console.error("Autosave lead field failed:", err)
      setSavingStates(prev => ({ ...prev, [lead.id]: 'error' }))
    }
  }

  // Optimistic Add New Row
  const handleAddNewRow = async () => {
    const tempId = 'temp-' + Date.now()
    const tempLead = {
      id: tempId,
      name: "New Lead",
      company: "New Company",
      email: "",
      phone: "",
      designation: "",
      status: "Yet to approach",
      owner: null,
      custom_fields: {
        "Meeting Date": "",
        "Outcome (Qualified / Not Qualified / Follow-up)": "Follow-up",
        "Demo Call": "NO",
        "Proposal Sent": "N/A",
        "Closures": "N/A"
      },
      isOptimistic: true
    }

    // Instantly render optimistic row in UI (0ms delay)
    setOptimisticLeads(prev => [tempLead, ...prev])
    setAddingRow(true)

    try {
      const defaultNewLead = {
        name: "New Lead",
        company: "New Company",
        email: "",
        phone: "",
        designation: "",
        status: "Yet to approach",
        custom_fields: {
          "Meeting Date": "",
          "Outcome (Qualified / Not Qualified / Follow-up)": "Follow-up",
          "Demo Call": "NO",
          "Proposal Sent": "N/A",
          "Closures": "N/A"
        }
      }
      const newRow = await createLead(defaultNewLead)
      if (newRow) {
        // Port any changes made in the optimistic row over to the actual created lead ID
        setLocalValues(prev => {
          const next = { ...prev }
          const fields = [
            "name", "company", "email", "phone", "designation", 
            "Meeting Date", "assignedTo", "status", 
            "Outcome (Qualified / Not Qualified / Follow-up)", 
            "linkedin", "Demo Call", "Proposal Sent", "Closures"
          ]
          fields.forEach(field => {
            const tempKey = `${tempId}-${field}`
            if (tempKey in next) {
              next[`${newRow.id}-${field}`] = next[tempKey]
              delete next[tempKey]
            }
          })
          return next
        })

        // Save any edited values to the backend if the user typed during creation
        const latestValues = localValuesRef.current
        const fields = [
          "name", "company", "email", "phone", "designation", 
          "Meeting Date", "assignedTo", "status", 
          "Outcome (Qualified / Not Qualified / Follow-up)", 
          "linkedin", "Demo Call", "Proposal Sent", "Closures"
        ]
        fields.forEach(field => {
          const tempKey = `${tempId}-${field}`
          if (latestValues[tempKey] !== undefined) {
            handleSaveField(newRow, field, latestValues[tempKey])
          }
        })

        // Automatically put new row into saved state
        setSavingStates(prev => ({ ...prev, [newRow.id]: 'saved' }))
        setTimeout(() => {
          setSavingStates(prev => {
            const copy = { ...prev }
            delete copy[newRow.id]
            return copy
          })
        }, 1500)
      }
    } catch (err) {
      console.error("Create new lead row failed:", err)
    } finally {
      // Remove the optimistic temporary row
      setOptimisticLeads(prev => prev.filter(l => l.id !== tempId))
      setAddingRow(false)
    }
  }

  const renderRowStatus = (leadId) => {
    const status = savingStates[leadId]
    if (status === 'saving') {
      return (
        <span 
          className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse border border-background shadow"
          title="Saving changes..."
        />
      )
    }
    if (status === 'saved') {
      return (
        <span 
          className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping border border-background shadow"
          title="Changes saved!"
        />
      )
    }
    if (status === 'error') {
      return (
        <span 
          className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-destructive border border-background shadow"
          title="Failed to save cell"
        />
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Spreadsheet Toolbar Panel */}
      <div className="flex flex-col gap-3 rounded-lg border border-border/40 bg-accent/20 p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
              ⚡ Live Spreadsheet Mode: Click any cell to edit. Your edits will auto-save on click-out. (Loaded: {allLeads.length} leads)
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNewRow}
              disabled={addingRow}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-black uppercase tracking-wider rounded-lg shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {addingRow ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Adding Row...
                </>
              ) : (
                <>
                  <Plus size={12} />
                  Add New Row
                </>
              )}
            </button>
            
            <button
              onClick={() => fetchLeads()}
              disabled={loading}
              title="Force reload list from database"
              className="flex items-center justify-center p-2 border border-border/60 hover:bg-accent/20 rounded-lg text-muted-foreground hover:text-foreground transition-all"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card/65 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
          <table className="min-w-[1750px] text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b bg-muted/65 text-[10px] uppercase tracking-widest font-black text-muted-foreground sticky top-0 z-10 select-none">
                <th className="w-[190px] px-3 py-3 border-r bg-muted/60">Contact Name</th>
                <th className="w-[180px] px-3 py-3 border-r bg-muted/60">Company Name</th>
                <th className="w-[200px] px-3 py-3 border-r bg-muted/60">Email Address</th>
                <th className="w-[150px] px-3 py-3 border-r bg-muted/60">Contact No</th>
                <th className="w-[150px] px-3 py-3 border-r bg-muted/60">Designation</th>
                <th className="w-[150px] px-3 py-3 border-r bg-muted/60">Meeting Date</th>
                <th className="w-[180px] px-3 py-3 border-r bg-muted/60">AE Assigned</th>
                <th className="w-[200px] px-3 py-3 border-r bg-muted/60 bg-yellow-500/5">Status (Completed/Rescheduled/etc.)</th>
                <th className="w-[200px] px-3 py-3 border-r bg-muted/60 bg-blue-500/5">Outcome (Qualified/Not-Qualified/etc.)</th>
                <th className="w-[180px] px-3 py-3 border-r bg-muted/60">Linkedin Connect</th>
                <th className="w-[100px] px-3 py-3 border-r bg-muted/60 text-center bg-green-500/5">Demo Call</th>
                <th className="w-[100px] px-3 py-3 border-r bg-muted/60 text-center bg-green-500/5">Proposal Sent</th>
                <th className="w-[100px] px-3 py-3 border-r bg-muted/60 text-center bg-green-500/5">Closures</th>
                <th className="w-[70px] px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && allLeads.length === 0 ? (
                <tr>
                  <td colSpan="14" className="px-6 py-12 text-center text-muted-foreground font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground animate-pulse">Loading leads from database...</span>
                    </div>
                  </td>
                </tr>
              ) : allLeads.length === 0 ? (
                <tr>
                  <td colSpan="14" className="px-6 py-12 text-center text-muted-foreground font-medium">
                    No spreadsheet rows found. Click "Add New Row" to start!
                  </td>
                </tr>
              ) : (
                allLeads.map((lead) => {
                  const leadName = localValues[`${lead.id}-name`] ?? (lead.name || "")
                  const leadCompany = localValues[`${lead.id}-company`] ?? (lead.company || "")
                  const leadEmail = localValues[`${lead.id}-email`] ?? (lead.email || "")
                  const leadPhone = localValues[`${lead.id}-phone`] ?? (lead.phone || "")
                  const leadDesignation = localValues[`${lead.id}-designation`] ?? (lead.designation || "")
                  const leadLinkedin = localValues[`${lead.id}-linkedin`] ?? (lead.linkedin_url || "")
                  
                  const custom = lead.custom_fields || {}
                  const leadMeetingDate = localValues[`${lead.id}-Meeting Date`] ?? (custom["Meeting Date"] || "")
                  const leadOutcome = localValues[`${lead.id}-Outcome (Qualified / Not Qualified / Follow-up)`] ?? (custom["Outcome (Qualified / Not Qualified / Follow-up)"] || "Follow-up")
                  const leadDemo = localValues[`${lead.id}-Demo Call`] ?? (custom["Demo Call"] || "NO")
                  const leadProposal = localValues[`${lead.id}-Proposal Sent`] ?? (custom["Proposal Sent"] || "N/A")
                  const leadClosures = localValues[`${lead.id}-Closures`] ?? (custom["Closures"] || "N/A")
                  
                  const leadOwner = localValues[`${lead.id}-assignedTo`] ?? (lead.owner?.id || "")
                  const leadStatus = localValues[`${lead.id}-status`] ?? (lead.status || "Yet to approach")

                  return (
                    <tr key={lead.id} className="hover:bg-accent/15 transition-colors group">
                      
                      {/* Contact Name (Buffered + Blur Save) */}
                      <td className="p-1 border-r border-border/40 relative pl-5">
                        {renderRowStatus(lead.id)}
                        <input
                          value={leadName}
                          onChange={(e) => handleFieldChange(lead.id, "name", e.target.value)}
                          onBlur={() => handleSaveField(lead, "name", leadName)}
                          placeholder="Contact name..."
                          className="w-full bg-transparent border-none px-1.5 py-1 text-sm font-bold text-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                        />
                      </td>

                      {/* Company Name */}
                      <td className="p-1 border-r border-border/40">
                        <input
                          value={leadCompany}
                          onChange={(e) => handleFieldChange(lead.id, "company", e.target.value)}
                          onBlur={() => handleSaveField(lead, "company", leadCompany)}
                          placeholder="Company name..."
                          className="w-full bg-transparent border-none px-1.5 py-1 text-sm text-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                        />
                      </td>

                      {/* Email Address */}
                      <td className="p-1 border-r border-border/40">
                        <input
                          type="email"
                          value={leadEmail}
                          onChange={(e) => handleFieldChange(lead.id, "email", e.target.value)}
                          onBlur={() => handleSaveField(lead, "email", leadEmail)}
                          placeholder="email@example.com"
                          className="w-full bg-transparent border-none px-1.5 py-1 text-sm italic text-muted-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                        />
                      </td>

                      {/* Contact No */}
                      <td className="p-1 border-r border-border/40">
                        <input
                          value={leadPhone}
                          onChange={(e) => handleFieldChange(lead.id, "phone", e.target.value)}
                          onBlur={() => handleSaveField(lead, "phone", leadPhone)}
                          placeholder="Phone number..."
                          className="w-full bg-transparent border-none px-1.5 py-1 text-sm text-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                        />
                      </td>

                      {/* Designation */}
                      <td className="p-1 border-r border-border/40">
                        <input
                          value={leadDesignation}
                          onChange={(e) => handleFieldChange(lead.id, "designation", e.target.value)}
                          onBlur={() => handleSaveField(lead, "designation", leadDesignation)}
                          placeholder="Designation..."
                          className="w-full bg-transparent border-none px-1.5 py-1 text-sm text-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                        />
                      </td>

                      {/* Meeting Date (Date Picker) */}
                      <td className="p-1 border-r border-border/40">
                        <input
                          type="date"
                          value={leadMeetingDate}
                          onChange={(e) => handleFieldChange(lead.id, "Meeting Date", e.target.value)}
                          onBlur={() => handleSaveField(lead, "Meeting Date", leadMeetingDate)}
                          className="w-full bg-transparent border-none px-1.5 py-1 text-xs text-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all cursor-pointer"
                        />
                      </td>

                      {/* AE Assigned (User Dropdown) */}
                      <td className="p-1 border-r border-border/40">
                        <select
                          value={leadOwner}
                          onChange={(e) => {
                            const val = e.target.value
                            handleFieldChange(lead.id, "assignedTo", val)
                            handleSaveField(lead, "assignedTo", val)
                          }}
                          className="w-full bg-transparent border-none px-1.5 py-1.5 text-sm text-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all cursor-pointer font-medium"
                        >
                          <option value="">Unassigned</option>
                          {safeUsers.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name || user.email}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status DROPDOWN (Column H) */}
                      <td className="p-1 border-r border-border/40 bg-yellow-500/5">
                        <select
                          value={leadStatus}
                          onChange={(e) => {
                            const val = e.target.value
                            handleFieldChange(lead.id, "status", val)
                            handleSaveField(lead, "status", val)
                          }}
                          className="w-full bg-transparent border-none px-1.5 py-1.5 text-sm font-bold text-amber-600 rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all cursor-pointer"
                        >
                          <option value="Yet to approach">Yet to approach</option>
                          <option value="In process">In process</option>
                          <option value="Completed">Completed</option>
                          <option value="Rescheduled">Rescheduled</option>
                          <option value="No Show">No Show</option>
                        </select>
                      </td>

                      {/* Outcome DROPDOWN (Column I) */}
                      <td className="p-1 border-r border-border/40 bg-blue-500/5">
                        <select
                          value={leadOutcome}
                          onChange={(e) => {
                            const val = e.target.value
                            handleFieldChange(lead.id, "Outcome (Qualified / Not Qualified / Follow-up)", val)
                            handleSaveField(lead, "Outcome (Qualified / Not Qualified / Follow-up)", val)
                          }}
                          className="w-full bg-transparent border-none px-1.5 py-1.5 text-sm text-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all cursor-pointer"
                        >
                          <option value="Follow-up">Follow-up</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Not Qualified">Not Qualified</option>
                        </select>
                      </td>

                      {/* Linkedin Connect */}
                      <td className="p-1 border-r border-border/40">
                        <input
                          value={leadLinkedin}
                          onChange={(e) => handleFieldChange(lead.id, "linkedin", e.target.value)}
                          onBlur={() => handleSaveField(lead, "linkedin", leadLinkedin)}
                          placeholder="https://linkedin.com/..."
                          className="w-full bg-transparent border-none px-1.5 py-1 text-xs text-primary rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all truncate"
                        />
                      </td>

                      {/* Demo Call */}
                      <td className="p-1 border-r border-border/40 text-center bg-green-500/5">
                        <select
                          value={leadDemo}
                          onChange={(e) => {
                            const val = e.target.value
                            handleFieldChange(lead.id, "Demo Call", val)
                            handleSaveField(lead, "Demo Call", val)
                          }}
                          className="w-full bg-transparent border-none px-1.5 py-1.5 text-sm text-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all cursor-pointer text-center"
                        >
                          <option value="NO">NO</option>
                          <option value="YES">YES</option>
                          <option value="N/A">N/A</option>
                        </select>
                      </td>

                      {/* Proposal Sent */}
                      <td className="p-1 border-r border-border/40 text-center bg-green-500/5">
                        <select
                          value={leadProposal}
                          onChange={(e) => {
                            const val = e.target.value
                            handleFieldChange(lead.id, "Proposal Sent", val)
                            handleSaveField(lead, "Proposal Sent", val)
                          }}
                          className="w-full bg-transparent border-none px-1.5 py-1.5 text-sm text-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all cursor-pointer text-center"
                        >
                          <option value="N/A">N/A</option>
                          <option value="YES">YES</option>
                          <option value="NO">NO</option>
                        </select>
                      </td>

                      {/* Closures */}
                      <td className="p-1 border-r border-border/40 text-center bg-green-500/5">
                        <select
                          value={leadClosures}
                          onChange={(e) => {
                            const val = e.target.value
                            handleFieldChange(lead.id, "Closures", val)
                            handleSaveField(lead, "Closures", val)
                          }}
                          className="w-full bg-transparent border-none px-1.5 py-1.5 text-sm text-foreground rounded focus:bg-background/80 focus:ring-1 focus:ring-primary/30 outline-none transition-all cursor-pointer text-center"
                        >
                          <option value="N/A">N/A</option>
                          <option value="YES">YES</option>
                          <option value="NO">NO</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-1 text-center">
                        <button
                          title="Delete Lead"
                          onClick={() => {
                            if (lead.isOptimistic) {
                              setOptimisticLeads(prev => prev.filter(l => l.id !== lead.id))
                              return
                            }
                            if (window.confirm("Are you sure you want to delete this lead?")) {
                              deleteLead(lead.id)
                            }
                          }}
                          className="p-1.5 hover:bg-destructive/15 rounded text-muted-foreground hover:text-destructive transition-colors inline-flex items-center justify-center"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LeadSpreadsheetView
