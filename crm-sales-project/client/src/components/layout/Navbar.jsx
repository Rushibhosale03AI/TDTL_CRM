import React, { useState, useEffect } from "react"
import { Search, Bell, User, Check, AlertCircle, Loader2, Sun, Moon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { useAuth } from "../../hooks/useAuth"
import { notificationsAPI } from "../../services/api"

const Navbar = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState("light")

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
      if (prefersDark) {
        document.documentElement.classList.add("dark")
      }
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    localStorage.setItem("theme", nextTheme)
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await notificationsAPI.list()
      setNotifications(Array.isArray(res.data.results) ? res.data.results : Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error("Failed to fetch notifications", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Poll every 45 seconds for real-time reminders
      const interval = setInterval(fetchNotifications, 45000)
      return () => clearInterval(interval)
    }
  }, [user])

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      // Instantly clear unread badges locally
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <header className="fixed right-0 top-0 z-30 flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b bg-card/80 backdrop-blur-md px-6">
      <div className="w-full max-w-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search leads, contacts..." 
            className="pl-9 bg-accent/50 border-none rounded-xl"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Dynamic Theme Switcher Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="rounded-full transition-all duration-300 hover:bg-accent"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-500 animate-spin-slow" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-600" />
          )}
        </Button>

        {/* Notification Bell Button */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(!isOpen)}
            className={`relative rounded-full transition-colors ${isOpen ? "bg-accent text-accent-foreground" : ""}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-black text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Bell Dropdown drawer */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-primary" />
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] uppercase font-black text-primary hover:text-primary-foreground tracking-wider flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-1">
                    <AlertCircle className="h-5 w-5 text-muted-foreground/40" />
                    No active notifications found.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 text-xs transition-colors flex items-start gap-2.5 ${
                        notif.is_read ? "bg-card opacity-70" : "bg-primary/5 border-l-2 border-primary"
                      }`}
                    >
                      <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center ${
                        notif.notification_type === "overdue" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                      }`}>
                        <AlertCircle className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <span className="font-bold text-foreground block">{notif.title}</span>
                        <p className="text-muted-foreground leading-tight">{notif.message}</p>
                        <span className="text-[9px] text-muted-foreground/80 block mt-1">
                          {new Date(notif.created_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div 
          onClick={() => navigate("/settings")} 
          className="flex items-center gap-3 cursor-pointer hover:bg-accent/40 p-1.5 px-3.5 rounded-xl transition-all border border-transparent hover:border-border/40"
          title="View profile settings"
        >
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none mb-0.5">{user?.name || "User"}</span>
            <span className="text-[10px] font-bold text-muted-foreground capitalize leading-none">{user?.role?.toLowerCase() || "Guest"}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
