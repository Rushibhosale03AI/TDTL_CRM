import React, { useState, useEffect } from "react"
import { 
  Sparkles, Send, BrainCircuit, Mail, MessageSquare, Clipboard, Check,
  Activity, Calendar, LineChart, FileText, ChevronRight, AlertCircle, RefreshCw 
} from "lucide-react"
import { aiAPI, leadsAPI } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { useAuth } from "../../hooks/useAuth"

const AICopilot = () => {
  const { user } = useAuth()
  const role = (user?.role || "SALES").toUpperCase()

  const [activeSubTab, setActiveSubTab] = useState("ai-chat")
  const [leads, setLeads] = useState([])
  const [selectedLeadId, setSelectedLeadId] = useState("")
  
  // AI Chat state
  const [chatInput, setChatInput] = useState("")
  const [chatLog, setChatLog] = useState([])
  const [chatLoading, setChatLoading] = useState(false)

  // AI Prediction state
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [leadSummary, setLeadSummary] = useState(null)
  const [loadingPrediction, setLoadingPrediction] = useState(false)
  const [dealPrediction, setDealPrediction] = useState(null)

  // AI Email generator state
  const [templateType, setTemplateType] = useState("follow_up")
  const [generatedEmail, setGeneratedEmail] = useState(null)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [copied, setCopied] = useState(false)

  // Dynamic Prompt Suggestions based on Role
  const promptSuggestions = {
    ADMIN: [
      { text: "📊 Total Company Revenue", query: "Show company-wide revenue insights" },
      { text: "🕒 EOD Reports Submitted", query: "Who has submitted their EOD reports today?" },
      { text: "🔥 Hot Company Leads", query: "Show high-priority active leads" },
      { text: "✏️ Pending Workloads", query: "Which representative has the highest workload?" }
    ],
    MANAGER: [
      { text: "📈 Team Revenue Performance", query: "Show team revenue performance" },
      { text: "🕒 Who Submitted EOD Today", query: "Who submitted EOD reports today?" },
      { text: "✏️ Team Pending Tasks", query: "Show team pending tasks" },
      { text: "🎯 High Score Leads", query: "Show high score team leads" }
    ],
    SALES: [
      { text: "✏️ My Pending Tasks Today", query: "What are my pending tasks for today?" },
      { text: "🎯 My Active Assigned Leads", query: "Show my active leads" },
      { text: "🕒 My EOD report status", query: "What is my EOD report status?" },
      { text: "✉️ Draft Outreach Email", query: "Generate follow-up email" }
    ]
  }[role] || []

  // Welcome message based on role
  useEffect(() => {
    let welcome = ""
    if (role === "ADMIN") {
      welcome = "Welcome CRM Administrator. I can fetch live metrics, EOD submissions, and workloads company-wide. Click a prompt suggestion below or enter a custom query!"
    } else if (role === "MANAGER") {
      welcome = "Welcome Sales Manager. I am linked to your team's live pipelines, tasks, and EOD logs. Ask me about active members or distribution scores!"
    } else {
      welcome = "Hi! I am your sales assistant. I can show your pending tasks, active leads, or generate customized email campaigns. Select a task below!"
    }
    setChatLog([
      { role: "assistant", message: welcome }
    ])
  }, [role])

  useEffect(() => {
    // Fetch leads for the dropdown
    const fetchLeads = async () => {
      try {
        const res = await leadsAPI.list()
        const items = res.data.results || res.data || []
        setLeads(items)
        if (items.length > 0) {
          setSelectedLeadId(items[0].id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchLeads()
  }, [])

  const handleChatSubmit = async (e, customQuery = null) => {
    if (e) e.preventDefault()
    const queryText = customQuery || chatInput
    if (!queryText.trim()) return

    setChatLog(prev => [...prev, { role: "user", message: queryText }])
    if (!customQuery) setChatInput("")
    setChatLoading(true)

    try {
      const res = await aiAPI.chat(queryText)
      setChatLog(prev => [...prev, { role: "assistant", message: res.data.reply }])
    } catch (err) {
      setChatLog(prev => [...prev, { role: "assistant", message: "I apologize, but I encountered an issue connecting to the AI core. Please check your network connection." }])
    } finally {
      setChatLoading(false)
    }
  }

  // custom markdown and list renderer
  const renderMarkdown = (text) => {
    if (!text) return ""
    return text.split("\n").map((line, i) => {
      let clean = line
      
      if (clean.startsWith("### ")) {
        return <h3 key={i} className="text-base font-black mt-3 mb-1 text-primary">{clean.replace("### ", "")}</h3>
      }
      if (clean.startsWith("#### ")) {
        return <h4 key={i} className="text-sm font-bold mt-2 mb-1 text-foreground">{clean.replace("#### ", "")}</h4>
      }
      
      const splitParts = clean.split("**")
      if (splitParts.length > 1) {
        return (
          <p key={i} className="text-sm leading-relaxed my-1">
            {splitParts.map((part, idx) => {
              if (idx % 2 === 1) {
                return <strong key={idx} className="font-extrabold text-foreground">{part}</strong>
              }
              return part
            })}
          </p>
        )
      }
      
      let isList = false
      if (clean.startsWith("* ") || clean.startsWith("- ")) {
        isList = true
        clean = clean.substring(2)
      } else if (/^\d+\.\s/.test(clean)) {
        isList = true
        clean = clean.replace(/^\d+\.\s/, "")
      }

      if (isList) {
        return (
          <div key={i} className="pl-4 py-0.5 flex items-start gap-1 text-sm text-muted-foreground leading-normal">
            <span>•</span>
            <div>{clean}</div>
          </div>
        )
      }
      
      return <p key={i} className="text-sm leading-relaxed my-1">{clean}</p>
    })
  }

  const handleLeadSummarize = async () => {
    if (!selectedLeadId) return
    setLoadingSummary(true)
    setLeadSummary(null)
    try {
      const res = await aiAPI.leadSummary(selectedLeadId)
      setLeadSummary(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleLeadPredict = async () => {
    if (!selectedLeadId) return
    setLoadingPrediction(true)
    setDealPrediction(null)
    try {
      const res = await aiAPI.salesPrediction(selectedLeadId)
      setDealPrediction(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPrediction(false)
    }
  }

  const handleEmailGenerate = async () => {
    setLoadingEmail(true)
    setGeneratedEmail(null)
    setCopied(false)
    try {
      const res = await aiAPI.generateEmail(selectedLeadId, templateType)
      setGeneratedEmail(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingEmail(false)
    }
  }

  const copyToClipboard = () => {
    if (!generatedEmail) return
    const text = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary animate-pulse" />
            AI Copilot Core
          </h2>
          <p className="text-muted-foreground mt-1">
            Accelerate your sales workflows using live generative insights, deal predictors, and outbound draft generators.
          </p>
        </div>
        <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 self-start md:self-auto">
          Role: {role}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-muted">
        <button 
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === "ai-chat" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveSubTab("ai-chat")}
        >
          <MessageSquare className="h-4 w-4" />
          Conversational Assistant
        </button>
        <button 
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === "predictive-analytics" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveSubTab("predictive-analytics")}
        >
          <Activity className="h-4 w-4" />
          Predictive Analytics
        </button>
        <button 
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === "email-generator" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveSubTab("email-generator")}
        >
          <Mail className="h-4 w-4" />
          Outbound Draft Generator
        </button>
      </div>

      {/* TAB 1: Conversational Chat */}
      {activeSubTab === "ai-chat" && (
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col h-[600px]">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            CRM Copilot Chat
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 p-2 mb-4 scrollbar-thin">
            {chatLog.map((chat, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[80%] ${
                  chat.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  chat.role === "user" ? "bg-primary text-white" : "bg-primary/10 text-primary"
                }`}>
                  {chat.role === "user" ? "U" : <Sparkles className="h-4 w-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm ${
                  chat.role === "user" 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-muted/40 text-foreground rounded-tl-none border"
                }`}>
                  {chat.role === "user" ? chat.message : renderMarkdown(chat.message)}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-spin">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div className="bg-muted/40 p-4 rounded-2xl text-sm rounded-tl-none border text-muted-foreground">
                  Analyzing database schemas & activity records...
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="mb-4 flex flex-wrap gap-2">
            {promptSuggestions.map((s, idx) => (
              <button
                key={idx}
                disabled={chatLoading}
                onClick={(e) => handleChatSubmit(e, s.query)}
                className="text-xs font-black bg-muted/40 hover:bg-primary/10 border border-muted hover:border-primary/30 text-foreground hover:text-primary px-3 py-1.5 rounded-xl transition-all"
              >
                {s.text}
              </button>
            ))}
          </div>

          <form onSubmit={handleChatSubmit} className="flex gap-2 border-t pt-4">
            <Input 
              type="text" 
              placeholder="Ask anything about pending leads, team workflows, or EOD summaries..." 
              value={chatInput}
              disabled={chatLoading}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={chatLoading || !chatInput.trim()}
              className="flex items-center justify-center px-4 font-bold shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* TAB 2: Lead Summary & Predictive Analytics */}
      {activeSubTab === "predictive-analytics" && (
        <div className="space-y-6">
          {/* Lead Selection Card */}
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Target Lead Selection</h3>
                <p className="text-xs text-muted-foreground">Choose a lead to analyze conversion potential and deal probability</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-2">Select Active Lead</label>
                <select 
                  className="w-full rounded-xl border-2 border-primary/30 bg-card/50 backdrop-blur p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={selectedLeadId}
                  onChange={(e) => {
                    setSelectedLeadId(e.target.value)
                    setLeadSummary(null)
                    setDealPrediction(null)
                  }}
                >
                  <option value="" disabled>-- Choose a Lead --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} • {l.company || "No Company"} • {l.status || "New"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end gap-2">
                <Button 
                  onClick={handleLeadSummarize} 
                  disabled={loadingSummary || !selectedLeadId} 
                  className="w-full flex items-center justify-center gap-2 font-bold shadow-lg"
                >
                  <FileText className="h-4 w-4" />
                  Evaluate Convertibility
                </Button>
                <Button 
                  onClick={handleLeadPredict} 
                  disabled={loadingPrediction || !selectedLeadId} 
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 font-bold shadow-lg"
                >
                  <LineChart className="h-4 w-4" />
                  Predict Deal Probability
                </Button>
              </div>
            </div>

            {/* Selected Lead Info Display */}
            {selectedLeadId && leads.find(l => l.id == selectedLeadId) && (
              <div className="mt-4 pt-4 border-t border-primary/20">
                {(() => {
                  const selectedLead = leads.find(l => l.id == selectedLeadId)
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-card/60 backdrop-blur p-3 rounded-lg border border-muted">
                        <span className="text-muted-foreground font-bold uppercase block mb-1">Lead Name</span>
                        <span className="text-foreground font-extrabold text-sm">{selectedLead.name}</span>
                      </div>
                      <div className="bg-card/60 backdrop-blur p-3 rounded-lg border border-muted">
                        <span className="text-muted-foreground font-bold uppercase block mb-1">Company</span>
                        <span className="text-foreground font-extrabold text-sm">{selectedLead.company || "N/A"}</span>
                      </div>
                      <div className="bg-card/60 backdrop-blur p-3 rounded-lg border border-muted">
                        <span className="text-muted-foreground font-bold uppercase block mb-1">Status</span>
                        <span className="text-primary font-extrabold text-sm">{selectedLead.status || "New"}</span>
                      </div>
                      <div className="bg-card/60 backdrop-blur p-3 rounded-lg border border-muted">
                        <span className="text-muted-foreground font-bold uppercase block mb-1">Lead Score</span>
                        <span className="text-primary font-extrabold text-sm">{selectedLead.score || 0}/100</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Convertibility Analysis */}
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 shadow-lg min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-muted">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">Dynamic Summary & Convertibility</h4>
                    <p className="text-[10px] text-muted-foreground">AI-powered lead analysis and conversion potential</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {loadingSummary && (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <RefreshCw className="h-12 w-12 animate-spin text-primary" />
                      <div className="absolute inset-0 h-12 w-12 rounded-full bg-primary/20 animate-ping" />
                    </div>
                    <span className="font-medium">Scanning lead profiles...</span>
                    <span className="text-xs text-muted-foreground/70">Analyzing conversion factors</span>
                  </div>
                )}

                {!loadingSummary && !leadSummary && (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Select a lead and click</p>
                    <p className="text-sm text-muted-foreground font-medium">"Evaluate Convertibility" to begin</p>
                  </div>
                )}

                {leadSummary && selectedLeadId && leads.find(l => l.id == selectedLeadId) && (() => {
                  const selectedLead = leads.find(l => l.id == selectedLeadId)
                  return (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      {/* Lead Header Card */}
                      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border-2 border-primary/30 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                            {selectedLead.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-base text-foreground">{selectedLead.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedLead.email || "No email"}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            selectedLead.status === "HOT" ? "bg-red-500/20 text-red-600 border border-red-500/30" :
                            selectedLead.status === "WARM" ? "bg-orange-500/20 text-orange-600 border border-orange-500/30" :
                            selectedLead.status === "COLD" ? "bg-blue-500/20 text-blue-600 border border-blue-500/30" :
                            "bg-green-500/20 text-green-600 border border-green-500/30"
                          }`}>
                            {selectedLead.status || "NEW"}
                          </div>
                        </div>

                        {/* Lead Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {selectedLead.company && (
                            <div className="bg-card/80 backdrop-blur p-2 rounded-lg border border-muted">
                              <span className="text-muted-foreground font-semibold block mb-0.5">Company</span>
                              <span className="text-foreground font-bold truncate block">{selectedLead.company}</span>
                            </div>
                          )}
                          {selectedLead.phone && (
                            <div className="bg-card/80 backdrop-blur p-2 rounded-lg border border-muted">
                              <span className="text-muted-foreground font-semibold block mb-0.5">Phone</span>
                              <span className="text-foreground font-bold truncate block">{selectedLead.phone}</span>
                            </div>
                          )}
                          {selectedLead.score !== undefined && (
                            <div className="bg-card/80 backdrop-blur p-2 rounded-lg border border-muted">
                              <span className="text-muted-foreground font-semibold block mb-0.5">Score</span>
                              <span className="text-primary font-black">{selectedLead.score}/100</span>
                            </div>
                          )}
                          {selectedLead.industry && (
                            <div className="bg-card/80 backdrop-blur p-2 rounded-lg border border-muted">
                              <span className="text-muted-foreground font-semibold block mb-0.5">Industry</span>
                              <span className="text-foreground font-bold truncate block">{selectedLead.industry}</span>
                            </div>
                          )}
                          {selectedLead.location && (
                            <div className="bg-card/80 backdrop-blur p-2 rounded-lg border border-muted col-span-2">
                              <span className="text-muted-foreground font-semibold block mb-0.5">Location</span>
                              <span className="text-foreground font-bold truncate block">{selectedLead.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Analysis Summary */}
                      <div className="bg-gradient-to-br from-purple-500/10 via-primary/5 to-transparent p-5 rounded-xl border-2 border-purple-500/20 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">AI Analysis for {selectedLead.name}</p>
                            <p className="text-sm text-foreground leading-relaxed font-medium">
                              {leadSummary.summary}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Convertibility Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Conversion Score */}
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl border-2 border-primary/30 shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Conversion Score</span>
                            <span className="text-xs font-black text-primary">{selectedLead.name.split(' ')[0]}</span>
                          </div>
                          <div className="text-4xl font-black text-primary mb-2">{leadSummary.conversionScore}</div>
                          <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 transition-all duration-1000 shadow-lg" 
                              style={{ width: `${leadSummary.conversionScore}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 font-medium">Based on {selectedLead.company || "company"} data</p>
                        </div>

                        {/* Interest Level */}
                        <div className={`p-4 rounded-xl border-2 shadow-md ${
                          leadSummary.interestLevel === "High" ? "bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/40" :
                          leadSummary.interestLevel === "Medium" ? "bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/40" : 
                          "bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/40"
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Interest Level</span>
                            <span className="text-xs font-black text-muted-foreground">{selectedLead.status || "Status"}</span>
                          </div>
                          <div className={`text-3xl font-black mb-1 ${
                            leadSummary.interestLevel === "High" ? "text-green-600" :
                            leadSummary.interestLevel === "Medium" ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {leadSummary.interestLevel}
                          </div>
                          <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            leadSummary.interestLevel === "High" ? "bg-green-500/30 text-green-700" :
                            leadSummary.interestLevel === "Medium" ? "bg-yellow-500/30 text-yellow-700" :
                            "bg-red-500/30 text-red-700"
                          }`}>
                            {leadSummary.interestLevel === "High" ? "Ready to Convert" : 
                             leadSummary.interestLevel === "Medium" ? "Needs Nurturing" : "Requires Attention"}
                          </div>
                        </div>
                      </div>

                      {/* Recommended Action for This Lead */}
                      {leadSummary.recommendedNextAction && (
                        <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 p-4 rounded-xl border-2 border-primary/20 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                              <ChevronRight className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-purple-600 font-black uppercase tracking-wider mb-0.5">Recommended Next Step for {selectedLead.name}</p>
                              <p className="text-sm text-foreground font-bold">{leadSummary.recommendedNextAction}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lead-Specific Insights */}
                      {(selectedLead.industry || selectedLead.location) && (
                        <div className="bg-muted/30 p-4 rounded-xl border border-muted">
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Lead Context</p>
                          <div className="space-y-1 text-xs">
                            {selectedLead.industry && (
                              <p className="text-foreground">
                                <span className="font-semibold text-primary">Industry Focus:</span> {selectedLead.industry} sector analysis applied
                              </p>
                            )}
                            {selectedLead.location && (
                              <p className="text-foreground">
                                <span className="font-semibold text-primary">Geographic Data:</span> {selectedLead.location} market trends considered
                              </p>
                            )}
                            {selectedLead.company && (
                              <p className="text-foreground">
                                <span className="font-semibold text-primary">Organization:</span> {selectedLead.company} profile evaluated
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Deal Probability Forecast */}
            <div className="bg-card border-2 border-purple-500/20 rounded-2xl p-6 shadow-lg min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-muted">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <LineChart className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">Deal Closure Probability</h4>
                    <p className="text-[10px] text-muted-foreground">Predictive forecasting & revenue analysis</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {loadingPrediction && (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <RefreshCw className="h-12 w-12 animate-spin text-purple-600" />
                      <div className="absolute inset-0 h-12 w-12 rounded-full bg-purple-600/20 animate-ping" />
                    </div>
                    <span className="font-medium">Compiling probability timelines...</span>
                    <span className="text-xs text-muted-foreground/70">Analyzing deal patterns</span>
                  </div>
                )}

                {!loadingPrediction && !dealPrediction && (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                      <LineChart className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Select a lead and click</p>
                    <p className="text-sm text-muted-foreground font-medium">"Predict Deal Probability" to forecast</p>
                  </div>
                )}

                {dealPrediction && selectedLeadId && leads.find(l => l.id == selectedLeadId) && (() => {
                  const selectedLead = leads.find(l => l.id == selectedLeadId)
                  return (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      {/* Lead Identifier Banner */}
                      <div className="bg-gradient-to-r from-purple-500/10 via-primary/10 to-pink-500/10 p-3 rounded-xl border-2 border-purple-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-600 font-black text-sm">
                              {selectedLead.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-black text-foreground">{selectedLead.name}</p>
                              <p className="text-[10px] text-muted-foreground">{selectedLead.company || "Organization"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Deal Forecast</p>
                            <p className="text-xs font-black text-purple-600">Lead #{selectedLead.id}</p>
                          </div>
                        </div>
                      </div>

                      {/* Probability Gauge - Lead Specific */}
                      <div className="bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent p-6 rounded-xl border-2 border-purple-500/30 shadow-lg">
                        <div className="text-center mb-4">
                          <p className="text-xs text-purple-600 font-black uppercase tracking-wider mb-1">
                            Closing Probability for {selectedLead.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Based on {selectedLead.status || "NEW"} status • {selectedLead.company || "No company"} • Score: {selectedLead.score || 0}
                          </p>
                        </div>
                        <div className="text-6xl font-black bg-gradient-to-r from-purple-600 via-primary to-pink-600 bg-clip-text text-transparent mb-3 text-center">
                          {dealPrediction.closingProbability}
                        </div>
                        <div className="h-4 bg-muted/40 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 via-primary to-pink-600 transition-all duration-1000 shadow-lg relative" 
                            style={{ width: dealPrediction.closingProbability }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </div>
                        </div>
                      </div>

                      {/* Revenue & Date Cards - Lead Contextual */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-5 rounded-xl border-2 border-green-500/30 shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Est. Revenue</span>
                            <span className="text-xs font-black text-green-600">💰</span>
                          </div>
                          <div className="text-3xl font-black text-green-600 mb-1">{dealPrediction.expectedRevenue}</div>
                          <p className="text-[10px] text-muted-foreground font-medium">From {selectedLead.name}</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-5 rounded-xl border-2 border-blue-500/30 shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Close Date</span>
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-2xl font-black text-blue-600 mb-1">
                            {dealPrediction.predictedCloseDate?.split('-').reverse().join('/') || "TBD"}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium">Est. for {selectedLead.name}</p>
                        </div>
                      </div>

                      {/* Confidence Indicator - Lead Based */}
                      {dealPrediction.confidenceInterval && (
                        <div className="bg-gradient-to-r from-muted/50 to-transparent p-4 rounded-xl border-2 border-muted/50 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="text-xs text-muted-foreground font-bold uppercase">Prediction Confidence</p>
                              <p className="text-[10px] text-muted-foreground">Based on {selectedLead.name}'s engagement</p>
                            </div>
                          </div>
                          <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase shadow-md ${
                            dealPrediction.confidenceInterval === "High" ? "bg-green-500/20 text-green-700 border-2 border-green-500/40" :
                            dealPrediction.confidenceInterval === "Medium" ? "bg-yellow-500/20 text-yellow-700 border-2 border-yellow-500/40" :
                            "bg-red-500/20 text-red-700 border-2 border-red-500/40"
                          }`}>
                            {dealPrediction.confidenceInterval}
                          </span>
                        </div>
                      )}

                      {/* Deal Insights - Lead Specific */}
                      <div className="bg-muted/30 p-4 rounded-xl border border-muted">
                        <p className="text-xs font-bold text-purple-600 uppercase mb-3 flex items-center gap-2">
                          <LineChart className="h-4 w-4" />
                          Deal Insights for {selectedLead.name}
                        </p>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between p-2 bg-card/60 rounded-lg">
                            <span className="text-muted-foreground">Lead Status Impact:</span>
                            <span className={`font-bold ${
                              selectedLead.status === "HOT" ? "text-red-600" :
                              selectedLead.status === "WARM" ? "text-orange-600" :
                              "text-blue-600"
                            }`}>{selectedLead.status || "NEW"}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-card/60 rounded-lg">
                            <span className="text-muted-foreground">Engagement Score:</span>
                            <span className="font-black text-primary">{selectedLead.score || 0}/100</span>
                          </div>
                          {selectedLead.industry && (
                            <div className="flex items-center justify-between p-2 bg-card/60 rounded-lg">
                              <span className="text-muted-foreground">Industry Factor:</span>
                              <span className="font-bold text-foreground">{selectedLead.industry}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Recommendation */}
                      <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 p-4 rounded-xl border-2 border-purple-500/20">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-primary flex items-center justify-center shrink-0 shadow-lg">
                            <ChevronRight className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-purple-600 font-black uppercase tracking-wider mb-0.5">
                              Strategy for {selectedLead.name}
                            </p>
                            <p className="text-sm text-foreground font-bold">
                              {parseInt(dealPrediction.closingProbability) >= 70 
                                ? `High conversion potential - prioritize immediate follow-up with ${selectedLead.name}`
                                : parseInt(dealPrediction.closingProbability) >= 40
                                ? `Moderate potential - continue nurturing ${selectedLead.name} with targeted content`
                                : `Low conversion risk - reevaluate fit with ${selectedLead.name} or extend nurture timeline`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Outbound Email generator */}
      {activeSubTab === "email-generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6 bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Outreach settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Target Lead Context</label>
                <select 
                  className="w-full mt-1 rounded-md border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                >
                  <option value="">-- Choose a Lead (Optional) --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.company || "No Company"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Template category</label>
                <select 
                  className="w-full mt-1 rounded-md border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                >
                  <option value="follow_up">Interactive Follow-up outreach</option>
                  <option value="proposal">Enterprise Solutions Proposal</option>
                  <option value="response">Standard Inquiry Response</option>
                </select>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleEmailGenerate} 
                  disabled={loadingEmail} 
                  className="w-full flex items-center justify-center gap-2 font-bold"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Outreach Draft
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card border rounded-2xl p-6 shadow-sm min-h-[380px] flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-3 mb-4">
                  <FileText className="h-4 w-4 text-primary" />
                  Generated Outbound Draft Template
                </h4>

                {loadingEmail && (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <span>Orchestrating high-conversion email formulas...</span>
                  </div>
                )}

                {!loadingEmail && !generatedEmail && (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    Adjust configurations and click 'Generate Outreach Draft'.
                  </div>
                )}

                {generatedEmail && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-muted/40 p-3 rounded-lg border flex items-center gap-2 text-xs font-bold text-foreground">
                      <span className="text-muted-foreground uppercase">Subject:</span>
                      <span>{generatedEmail.subject}</span>
                    </div>
                    <textarea 
                      readOnly 
                      value={generatedEmail.body} 
                      rows={10}
                      className="w-full rounded-xl border bg-transparent p-4 text-sm font-mono leading-relaxed focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {generatedEmail && (
                <div className="border-t pt-4 flex justify-end">
                  <Button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 font-bold bg-primary hover:bg-primary/90 text-white"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    {copied ? "Copied Outreach Draft!" : "Copy to Clipboard"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AICopilot
