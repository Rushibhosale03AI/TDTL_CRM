import React, { useState, useEffect, useRef } from "react"
import { Sparkles, Send, BrainCircuit, X, MessageSquare, RefreshCw } from "lucide-react"
import { aiAPI } from "../../services/api"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"

const FloatingAICopilot = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatLog, setChatLog] = useState([])
  const chatEndRef = useRef(null)

  const role = (user?.role || "SALES").toUpperCase()

  // Dynamic Prompt Suggestions based on Roles
  const promptSuggestions = {
    ADMIN: [
      { text: "Show total revenue", query: "Show company-wide revenue insights" },
      { text: "Who submitted EOD today?", query: "Who has submitted their EOD reports today?" },
      { text: "High workload employees", query: "Which representative has the highest workload?" },
      { text: "High priority leads", query: "Show high-priority active leads" }
    ],
    MANAGER: [
      { text: "Team performance", query: "Show team revenue performance" },
      { text: "EOD reports today", query: "Who submitted EOD reports today?" },
      { text: "Team active tasks", query: "Show team pending tasks" },
      { text: "Hot team leads", query: "Show high score team leads" }
    ],
    SALES: [
      { text: "My tasks today", query: "What are my pending tasks for today?" },
      { text: "My active leads", query: "Show my active leads" },
      { text: "My EOD status", query: "What is my EOD report status?" },
      { text: "Generate follow-up email", query: "Generate follow-up email" }
    ]
  }[role] || []

  // Initialize welcome message based on role
  useEffect(() => {
    let welcome = ""
    if (role === "ADMIN") {
      welcome = "Welcome Administrator. I can fetch live metrics, growth charts, active EOD submissions, and workload ranking. Try clicking a suggested action below!"
    } else if (role === "MANAGER") {
      welcome = "Welcome Team Manager. I monitor your team's live activity, tasks completed, and conversion pipelines. Ask me about team EODs or task distribution."
    } else {
      welcome = "Hi! I am your sales copilot. I can list your pending tasks, help evaluate assigned leads, and draft high-conversion outbound follow-ups instantly!"
    }
    setChatLog([
      { role: "assistant", message: welcome }
    ])
  }, [role])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [chatLog, isOpen])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

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
      setChatLog(prev => [...prev, { role: "assistant", message: "I apologize, but I encountered an issue querying the database. Please try again in a moment." }])
    } finally {
      setChatLoading(false)
    }
  }

  // Mini-markdown formatting helper for compact drawer
  const renderMarkdown = (text) => {
    if (!text) return ""
    return text.split("\n").map((line, i) => {
      let clean = line
      
      if (clean.startsWith("### ")) {
        return <h3 key={i} className="text-sm font-black mt-2 mb-1 text-primary">{clean.replace("### ", "")}</h3>
      }
      if (clean.startsWith("#### ")) {
        return <h4 key={i} className="text-xs font-black mt-1.5 mb-0.5 text-foreground">{clean.replace("#### ", "")}</h4>
      }
      
      const boldRegex = /\*\*(.*?)\*\*/g
      let parts = []
      let lastIndex = 0
      let match
      
      let isList = false
      if (clean.startsWith("* ") || clean.startsWith("- ")) {
        isList = true
        clean = clean.substring(2)
      } else if (/^\d+\.\s/.test(clean)) {
        isList = true
        clean = clean.replace(/^\d+\.\s/, "")
      }

      while ((match = boldRegex.exec(clean)) !== null) {
        if (match.index > lastIndex) {
          parts.push(clean.substring(lastIndex, match.index))
        }
        parts.push(<strong key={match.index} className="font-extrabold text-foreground">{match[1]}</strong>)
        lastIndex = boldRegex.lastIndex
      }
      if (lastIndex < clean.length) {
        parts.push(clean.substring(lastIndex))
      }
      
      if (isList) {
        return (
          <div key={i} className="pl-3 py-0.5 flex items-start gap-1 text-[11px] text-muted-foreground leading-normal">
            <span>•</span>
            <div>{parts.length > 0 ? parts : clean}</div>
          </div>
        )
      }
      
      return <p key={i} className="text-[11px] leading-relaxed my-0.5">{parts.length > 0 ? parts : clean}</p>
    })
  }

  if (!user) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-white/10 hover:shadow-primary/40 group relative"
      >
        <div className="absolute -top-1 -right-1 bg-green-500 h-3.5 w-3.5 rounded-full border-2 border-background animate-pulse" />
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6 animate-pulse" />}
      </button>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[360px] h-[480px] bg-card/95 backdrop-blur-md border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          {/* Drawer Header */}
          <div className="bg-gradient-to-r from-primary to-primary-foreground p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-white animate-pulse" />
              <div>
                <h4 className="text-xs uppercase font-extrabold tracking-widest text-white/70">TDTL CRM</h4>
                <h3 className="text-sm font-black leading-none mt-0.5">AI Copilot Assistant</h3>
              </div>
            </div>
            <span className="bg-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              {role}
            </span>
          </div>

          {/* Drawer Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {chatLog.map((chat, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2 max-w-[85%] ${
                  chat.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  chat.role === "user" ? "bg-primary text-white" : "bg-primary/10 text-primary"
                }`}>
                  {chat.role === "user" ? "U" : <Sparkles className="h-3 w-3" />}
                </div>
                <div className={`p-3 rounded-xl text-[11px] ${
                  chat.role === "user" 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-muted/40 text-foreground rounded-tl-none border"
                }`}>
                  {chat.role === "user" ? chat.message : renderMarkdown(chat.message)}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-spin">
                  <RefreshCw className="h-3 w-3" />
                </div>
                <div className="bg-muted/40 p-3 rounded-xl text-[11px] rounded-tl-none border text-muted-foreground animate-pulse">
                  Fetching dynamic database metrics...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="p-3 bg-muted/20 border-t border-b flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {promptSuggestions.map((s, idx) => (
              <button
                key={idx}
                disabled={chatLoading}
                onClick={(e) => handleChatSubmit(e, s.query)}
                className="text-[10px] font-bold bg-card border border-muted hover:border-primary/50 text-foreground hover:text-primary px-2 py-1 rounded-md transition-all truncate max-w-full"
              >
                {s.text}
              </button>
            ))}
          </div>

          {/* Chat Form Input */}
          <form 
            onSubmit={(e) => handleChatSubmit(e)} 
            className="p-3 bg-card flex gap-2"
          >
            <Input 
              type="text" 
              placeholder="Ask anything..." 
              value={chatInput}
              disabled={chatLoading}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 h-9 text-xs focus:ring-1 focus:ring-primary bg-muted/10 border"
            />
            <Button 
              type="submit" 
              disabled={chatLoading || !chatInput.trim()}
              className="h-9 px-3 flex items-center justify-center font-bold"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>

        </div>
      )}
    </div>
  )
}

export default FloatingAICopilot
