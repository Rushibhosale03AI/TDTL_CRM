import React, { useState, useEffect } from "react"
import { 
  FileText, Plus, CheckCircle, XCircle, BarChart3, AlertCircle, 
  Calendar, Check, RefreshCw, Send, ShieldAlert, Sparkles, MessageSquare, Download 
} from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { eodAPI } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"

const EveningReports = () => {
  const { user } = useAuth()
  const userRole = user?.role?.toUpperCase() || ""
  const [activeTab, setActiveTab] = useState(userRole === "SALES" ? "my-reports" : "team-reports")
  const [myReports, setMyReports] = useState([])
  const [teamReports, setTeamReports] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  
  // EOD Form state
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split("T")[0],
    calls_done: 0,
    emails_sent: 0,
    followups_done: 0,
    meetings_fixed: 0,
    meetings_fixed_details: "",
    meetings_attended: 0,
    meetings_attended_details: "",
    leads_generated: 0,
    linkedin_outreach: 0,
    demos_given: 0,
    key_highlights: "",
    tomorrow_plan: "",
    challenges_faced: ""
  })

  // Dynamic Productivity Score Calculation
  const calculateScore = () => {
    return (
      (parseInt(formData.calls_done || 0) * 1) +
      (parseInt(formData.emails_sent || 0) * 1) +
      (parseInt(formData.followups_done || 0) * 2) +
      (parseInt(formData.meetings_fixed || 0) * 5) +
      (parseInt(formData.meetings_attended || 0) * 7) +
      (parseInt(formData.leads_generated || 0) * 10) +
      (parseInt(formData.demos_given || 0) * 10)
    )
  }

  // Manager Approval State
  const [approvalRemarks, setApprovalRemarks] = useState("")

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchMyReports = async () => {
    try {
      setLoading(true)
      const res = await eodAPI.myReports()
      setMyReports(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      showToast("Failed to fetch EOD reports", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamReports = async () => {
    try {
      setLoading(true)
      const res = userRole === "ADMIN" ? await eodAPI.allReports() : await eodAPI.teamReports()
      setTeamReports(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      showToast("Failed to fetch team EOD reports", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const res = await eodAPI.analytics()
      setAnalytics(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!userRole) return
    
    // Dynamically update active tab if it's set to invalid tab for user role
    if (userRole === "SALES") {
      setActiveTab("my-reports")
      fetchMyReports()
    } else {
      setActiveTab("team-reports")
      fetchTeamReports()
      fetchAnalytics()
    }
  }, [userRole])

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Math.max(0, parseInt(value) || 0) : value
    }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await eodAPI.create(formData)
      showToast("Evening Report submitted successfully!", "success")
      fetchMyReports()
      // Reset form
      setFormData({
        report_date: new Date().toISOString().split("T")[0],
        calls_done: 0,
        emails_sent: 0,
        followups_done: 0,
        meetings_fixed: 0,
        meetings_fixed_details: "",
        meetings_attended: 0,
        meetings_attended_details: "",
        leads_generated: 0,
        linkedin_outreach: 0,
        demos_given: 0,
        key_highlights: "",
        tomorrow_plan: "",
        challenges_faced: ""
      })
    } catch (err) {
      const msg = err.response?.data?.error || "Error submitting evening report."
      showToast(msg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      setLoading(true)
      await eodAPI.approve(id, approvalRemarks)
      showToast("EOD Report Approved!", "success")
      setApprovalRemarks("")
      fetchTeamReports()
      fetchAnalytics()
    } catch (err) {
      showToast("Failed to approve report", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (id) => {
    if (!approvalRemarks) {
      showToast("Please provide manager remarks before rejecting.", "error")
      return
    }
    try {
      setLoading(true)
      await eodAPI.reject(id, approvalRemarks)
      showToast("EOD Report Rejected.", "warning")
      setApprovalRemarks("")
      fetchTeamReports()
      fetchAnalytics()
    } catch (err) {
      showToast("Failed to reject report", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      showToast("Generating EOD Excel export...", "success")
      const response = await eodAPI.export()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `eod_reports_${new Date().toISOString().split("T")[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
    } catch (err) {
      showToast("Failed to export Excel", "error")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-white font-medium transition-all ${
          toast.type === "error" ? "bg-destructive border-red-500" : "bg-primary border-primary/20"
        }`}>
          {toast.type === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10 shadow-sm">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <Sparkles className="h-7 w-7 text-primary animate-pulse" />
            Evening Report EOD Hub
          </h2>
          <p className="text-muted-foreground mt-1">
            Submit daily activity telemetry, track productivity milestones, and process manager approvals.
          </p>
        </div>
        {(userRole === "ADMIN" || userRole === "MANAGER") && (
          <Button onClick={handleExport} className="flex items-center gap-2 font-bold px-4">
            <Download className="h-4 w-4" />
            Export EOD Data
          </Button>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-muted">
        {userRole === "SALES" && (
          <>
            <button 
              className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "my-reports" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("my-reports")}
            >
              My Report History
            </button>
            <button 
              className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "submit-report" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("submit-report")}
            >
              Submit Daily Report
            </button>
          </>
        )}

        {(userRole === "MANAGER" || userRole === "ADMIN") && (
          <>
            <button 
              className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "team-reports" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("team-reports")}
            >
              Team Submissions ({teamReports.length})
            </button>
            <button 
              className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "analytics" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("analytics")}
            >
              Productivity Dashboards
            </button>
          </>
        )}
      </div>

      {/* TAB CONTENT: Submit Report */}
      {activeTab === "submit-report" && userRole === "SALES" && (
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold border-b pb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Daily Telemetry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                <Input 
                  type="date" 
                  name="report_date" 
                  value={formData.report_date} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Calls Completed</label>
                <Input 
                  type="number" 
                  name="calls_done" 
                  value={formData.calls_done} 
                  onChange={handleInputChange} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Emails Outbox</label>
                <Input 
                  type="number" 
                  name="emails_sent" 
                  value={formData.emails_sent} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Follow-ups Completed</label>
                <Input 
                  type="number" 
                  name="followups_done" 
                  value={formData.followups_done} 
                  onChange={handleInputChange} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Meetings Fixed</label>
                <Input 
                  type="number" 
                  name="meetings_fixed" 
                  value={formData.meetings_fixed} 
                  onChange={handleInputChange} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Meetings Attended</label>
                <Input 
                  type="number" 
                  name="meetings_attended" 
                  value={formData.meetings_attended} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Leads Generated</label>
                <Input 
                  type="number" 
                  name="leads_generated" 
                  value={formData.leads_generated} 
                  onChange={handleInputChange} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">LinkedIn Outreach</label>
                <Input 
                  type="number" 
                  name="linkedin_outreach" 
                  value={formData.linkedin_outreach} 
                  onChange={handleInputChange} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Product Demos Given</label>
                <Input 
                  type="number" 
                  name="demos_given" 
                  value={formData.demos_given} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Meetings Fixed Details</label>
                <textarea 
                  name="meetings_fixed_details" 
                  value={formData.meetings_fixed_details} 
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full rounded-md border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Fixed meeting with CEO of CyberCorp on Friday..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Meetings Attended Details</label>
                <textarea 
                  name="meetings_attended_details" 
                  value={formData.meetings_attended_details} 
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full rounded-md border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Met CTO of Innotech. Pitch went exceptionally well..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Key Highlights of the Day</label>
                <textarea 
                  name="key_highlights" 
                  value={formData.key_highlights} 
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="What were the biggest achievements today?"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Plan for Tomorrow</label>
                <textarea 
                  name="tomorrow_plan" 
                  value={formData.tomorrow_plan} 
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="What will you focus on tomorrow?"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Challenges Faced & Support Needed</label>
                <textarea 
                  name="challenges_faced" 
                  value={formData.challenges_faced} 
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Outline any blockers or friction points..."
                />
              </div>
            </div>
          </div>

          {/* Right Column: Score dial & instructions */}
          <div className="space-y-6">
            <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Productivity index</h4>
              <div className="h-40 w-40 rounded-full border-8 border-dashed border-primary/20 flex flex-col items-center justify-center mt-6">
                <span className="text-5xl font-black text-primary">{calculateScore()}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">EOD Points</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 max-w-[200px]">
                Points are calculated automatically based on calls, meetings, follow-ups, and leads generated.
              </p>
              <Button type="submit" disabled={loading} className="w-full mt-6 flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />
                Submit EOD Report
              </Button>
            </div>

            <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Points Weighting Chart
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b py-1"><span>Calls / Emails</span><span className="font-bold text-primary">1 Point</span></div>
                <div className="flex justify-between border-b py-1"><span>Follow-ups</span><span className="font-bold text-primary">2 Points</span></div>
                <div className="flex justify-between border-b py-1"><span>Meetings Fixed</span><span className="font-bold text-primary">5 Points</span></div>
                <div className="flex justify-between border-b py-1"><span>Meetings Attended</span><span className="font-bold text-primary">7 Points</span></div>
                <div className="flex justify-between border-b py-1"><span>Leads / Demos</span><span className="font-bold text-primary">10 Points</span></div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB CONTENT: My Report History */}
      {activeTab === "my-reports" && userRole === "SALES" && (
        <div className="space-y-4">
          {myReports.length === 0 && (
            <div className="bg-card border rounded-2xl p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h4 className="font-bold">No EOD Reports Submitted Yet</h4>
              <p className="text-xs text-muted-foreground mt-1">You haven't filed any daily reports. Head to 'Submit Daily Report' to start.</p>
            </div>
          )}

          {myReports.map((report) => (
            <div key={report.id} className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">{report.report_date}</span>
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                    report.submission_status === "approved" ? "bg-green-500/10 text-green-500" :
                    report.submission_status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {report.submission_status}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                  <span className="text-xs text-muted-foreground uppercase font-bold">Productivity Score:</span>
                  <span className="font-black text-primary text-sm">{report.productivity_score}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
                <div className="bg-muted/30 p-2 rounded-xl"><span className="block text-xl font-bold">{report.calls_done}</span><span className="text-[10px] text-muted-foreground uppercase">Calls</span></div>
                <div className="bg-muted/30 p-2 rounded-xl"><span className="block text-xl font-bold">{report.emails_sent}</span><span className="text-[10px] text-muted-foreground uppercase">Emails</span></div>
                <div className="bg-muted/30 p-2 rounded-xl"><span className="block text-xl font-bold">{report.followups_done}</span><span className="text-[10px] text-muted-foreground uppercase">Follow-ups</span></div>
                <div className="bg-muted/30 p-2 rounded-xl"><span className="block text-xl font-bold">{report.meetings_fixed}</span><span className="text-[10px] text-muted-foreground uppercase">Fixed</span></div>
                <div className="bg-muted/30 p-2 rounded-xl"><span className="block text-xl font-bold">{report.meetings_attended}</span><span className="text-[10px] text-muted-foreground uppercase">Attended</span></div>
                <div className="bg-muted/30 p-2 rounded-xl"><span className="block text-xl font-bold">{report.leads_generated}</span><span className="text-[10px] text-muted-foreground uppercase">Leads</span></div>
                <div className="bg-muted/30 p-2 rounded-xl"><span className="block text-xl font-bold">{report.linkedin_outreach}</span><span className="text-[10px] text-muted-foreground uppercase">Outreach</span></div>
                <div className="bg-muted/30 p-2 rounded-xl"><span className="block text-xl font-bold">{report.demos_given}</span><span className="text-[10px] text-muted-foreground uppercase">Demos</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div><h5 className="font-bold text-primary">Key Highlights:</h5><p className="text-muted-foreground mt-1">{report.key_highlights || "No highlights logged"}</p></div>
                <div><h5 className="font-bold text-primary">Tomorrow's Plan:</h5><p className="text-muted-foreground mt-1">{report.tomorrow_plan || "No tomorrow's plan logged"}</p></div>
                <div><h5 className="font-bold text-primary">Challenges Faced:</h5><p className="text-muted-foreground mt-1">{report.challenges_faced || "No challenges logged"}</p></div>
              </div>

              {report.manager_remarks && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3 mt-4 text-sm">
                  <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Manager Feedback remarks:</h5>
                    <p className="text-muted-foreground mt-1">{report.manager_remarks}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: Team Submissions */}
      {activeTab === "team-reports" && (userRole === "MANAGER" || userRole === "ADMIN") && (
        <div className="space-y-6">
          {teamReports.length === 0 && (
            <div className="bg-card border rounded-2xl p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h4 className="font-bold">No Submissions Found</h4>
              <p className="text-xs text-muted-foreground mt-1">No daily reports have been submitted by your team members yet.</p>
            </div>
          )}

          {teamReports.map((report) => (
            <div key={report.id} className="bg-card border rounded-2xl p-6 shadow-sm space-y-6 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {report.employee_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-lg block">{report.employee_name}</span>
                    <span className="text-xs text-muted-foreground font-medium">{report.employee_email} • Reported on: {report.report_date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                    report.submission_status === "approved" ? "bg-green-500/10 text-green-500" :
                    report.submission_status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {report.submission_status}
                  </span>
                  <div className="bg-primary/5 px-3 py-1 rounded-lg border border-primary/10 flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Score:</span>
                    <span className="font-black text-primary text-sm">{report.productivity_score}</span>
                  </div>
                </div>
              </div>

              {/* Stat dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
                <div className="bg-muted/20 p-2 rounded-xl"><span className="block text-xl font-bold">{report.calls_done}</span><span className="text-[10px] text-muted-foreground uppercase">Calls</span></div>
                <div className="bg-muted/20 p-2 rounded-xl"><span className="block text-xl font-bold">{report.emails_sent}</span><span className="text-[10px] text-muted-foreground uppercase">Emails</span></div>
                <div className="bg-muted/20 p-2 rounded-xl"><span className="block text-xl font-bold">{report.followups_done}</span><span className="text-[10px] text-muted-foreground uppercase">Followups</span></div>
                <div className="bg-muted/20 p-2 rounded-xl"><span className="block text-xl font-bold">{report.meetings_fixed}</span><span className="text-[10px] text-muted-foreground uppercase">Fixed</span></div>
                <div className="bg-muted/20 p-2 rounded-xl"><span className="block text-xl font-bold">{report.meetings_attended}</span><span className="text-[10px] text-muted-foreground uppercase">Attended</span></div>
                <div className="bg-muted/20 p-2 rounded-xl"><span className="block text-xl font-bold">{report.leads_generated}</span><span className="text-[10px] text-muted-foreground uppercase">Leads</span></div>
                <div className="bg-muted/20 p-2 rounded-xl"><span className="block text-xl font-bold">{report.linkedin_outreach}</span><span className="text-[10px] text-muted-foreground uppercase">Outreach</span></div>
                <div className="bg-muted/20 p-2 rounded-xl"><span className="block text-xl font-bold">{report.demos_given}</span><span className="text-[10px] text-muted-foreground uppercase">Demos</span></div>
              </div>

              {/* Text logs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div><h5 className="font-bold text-primary">Key Highlights:</h5><p className="text-muted-foreground mt-1">{report.key_highlights || "No highlights logged"}</p></div>
                <div><h5 className="font-bold text-primary">Tomorrow's Plan:</h5><p className="text-muted-foreground mt-1">{report.tomorrow_plan || "No tomorrow plan logged"}</p></div>
                <div><h5 className="font-bold text-primary">Challenges Faced:</h5><p className="text-muted-foreground mt-1">{report.challenges_faced || "No challenges logged"}</p></div>
              </div>

              {report.meetings_fixed_details && (
                <div className="text-sm bg-muted/30 p-3 rounded-xl">
                  <span className="font-bold block text-foreground">Meetings Fixed Details:</span>
                  <p className="text-muted-foreground mt-1">{report.meetings_fixed_details}</p>
                </div>
              )}

              {/* Approval actions if status is pending / submitted */}
              {report.submission_status !== "approved" && (
                <div className="border-t pt-4 space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Manager remarks / Approval Feedback</label>
                    <textarea 
                      value={approvalRemarks}
                      onChange={(e) => setApprovalRemarks(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Add remarks here to approve or reject..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => handleApprove(report.id)} 
                      disabled={loading} 
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                      <Check className="h-4 w-4" />
                      Approve Report
                    </Button>
                    <Button 
                      onClick={() => handleReject(report.id)} 
                      disabled={loading} 
                      className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-white font-bold"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Report
                    </Button>
                  </div>
                </div>
              )}

              {report.submission_status === "approved" && report.manager_remarks && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3 mt-4 text-sm">
                  <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Remarks Added:</h5>
                    <p className="text-muted-foreground mt-1">{report.manager_remarks}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: Productivity Analytics */}
      {activeTab === "analytics" && (userRole === "MANAGER" || userRole === "ADMIN") && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><BarChart3 className="h-6 w-6" /></div>
              <div><span className="block text-2xl font-black text-foreground">{analytics?.totals?.calls || 0}</span><span className="text-xs text-muted-foreground font-medium uppercase">Total Calls</span></div>
            </div>
            <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FileText className="h-6 w-6" /></div>
              <div><span className="block text-2xl font-black text-foreground">{analytics?.totals?.emails || 0}</span><span className="text-xs text-muted-foreground font-medium uppercase">Total Emails</span></div>
            </div>
            <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><CheckCircle className="h-6 w-6" /></div>
              <div><span className="block text-2xl font-black text-foreground">{analytics?.totals?.meetings || 0}</span><span className="text-xs text-muted-foreground font-medium uppercase">Meetings Met</span></div>
            </div>
            <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Plus className="h-6 w-6" /></div>
              <div><span className="block text-2xl font-black text-foreground">{analytics?.totals?.leads || 0}</span><span className="text-xs text-muted-foreground font-medium uppercase">Leads Added</span></div>
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-lg font-bold">Team Productivity Trends</h4>
            <p className="text-xs text-muted-foreground">Historical visual representations of average daily activity points compiled by managers.</p>
            <div className="space-y-4 mt-6">
              {(analytics?.productivityTrend || []).map((t, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{t.date}</span>
                    <span className="text-primary">{t.score} Points Avg</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary-foreground transition-all duration-500" 
                      style={{ width: `${Math.min(t.score, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!analytics || !analytics.productivityTrend || analytics.productivityTrend.length === 0) && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No historical visual trends currently accumulated.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EveningReports
