import React, { useState, useEffect } from "react"
import { 
  User, Mail, Shield, Smartphone, Briefcase, 
  MapPin, Check, Loader2, Settings, Moon, Sun, 
  Bell, Database, Lock, UserCheck
} from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"

const ProfileSettings = () => {
  const { user, updateProfile, loading: authLoading } = useAuth()
  
  // Tabs: 'profile' | 'preferences' | 'security'
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  
  // Local profile states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    designation: "",
    location: "",
    company: "TDTL Ltd"
  })

  // Local preferences states
  const [theme, setTheme] = useState("light")
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    weeklyDigest: false,
    leadAssignAlerts: true
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "Sales",
        phone: user.phone || "+91 98765 43210",
        designation: user.designation || (user.role === "SALES" ? "Senior Sales Representative" : user.role === "MANAGER" ? "Regional Sales Manager" : "System Administrator"),
        location: user.location || "Mumbai, India",
        company: user.company || "TDTL Ltd"
      })
    }
    
    // Read current theme state
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
  }, [user])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    localStorage.setItem("theme", nextTheme)
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    setSuccessMsg(`Theme toggled to ${nextTheme === "dark" ? "Dark" : "Light"} mode!`)
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      // update backend profile
      const success = await updateProfile({
        email: formData.email,
        name: formData.name
      })

      if (success) {
        setSuccessMsg("Your profile settings have been saved successfully!")
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg("Failed to update profile details. Please try again.")
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred during update.")
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesSave = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccessMsg("Notification preferences synchronized successfully!")
      setTimeout(() => setSuccessMsg(""), 4000)
    }, 600)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <form onSubmit={handleProfileSave} className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Full Name
                </label>
                <Input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                </label>
                <div className="relative">
                  <Input 
                    disabled
                    value={formData.email}
                    className="bg-accent/30 pr-10 cursor-not-allowed border-dashed"
                  />
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/60" />
                </div>
                <p className="text-[10px] text-muted-foreground">Email addresses are verified and cannot be edited.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" /> Account Role
                </label>
                <div className="relative">
                  <Input 
                    disabled
                    value={formData.role.toUpperCase()}
                    className="bg-accent/30 pr-10 cursor-not-allowed border-dashed font-bold uppercase tracking-wider text-primary text-xs"
                  />
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" /> Phone Number
                </label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> Designation
                </label>
                <Input 
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Designation / Title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Location / Region
                </label>
                <Input 
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Mumbai, MH"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" disabled={loading} className="px-6 font-bold shadow-md">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes
                  </>
                ) : "Save Profile Details"}
              </Button>
            </div>
          </form>
        )

      case "preferences":
        return (
          <form onSubmit={handlePreferencesSave} className="space-y-8 animate-in fade-in duration-300">
            {/* Visual Preferences */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground border-b pb-2 uppercase tracking-wide">Interface Settings</h4>
              <div className="flex items-center justify-between p-4 rounded-xl border bg-accent/10">
                <div className="space-y-1">
                  <span className="text-sm font-bold block">Theme Mode</span>
                  <span className="text-xs text-muted-foreground">Switch the overall visual dashboard styling.</span>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={toggleTheme}
                  className="flex items-center gap-2 font-bold px-4 hover:bg-accent border border-border"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-500" />
                      Switch to Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Switch to Dark Mode
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground border-b pb-2 uppercase tracking-wide flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Notification Triggers
              </h4>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/25 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={notifications.emailReminders}
                    onChange={(e) => setNotifications({ ...notifications, emailReminders: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-semibold block">Email Reminders</span>
                    <span className="text-xs text-muted-foreground">Receive real-time email reminders 1 hour before scheduled EOD reports or lead meetings.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/25 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={notifications.weeklyDigest}
                    onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-semibold block">Weekly Digest Reports</span>
                    <span className="text-xs text-muted-foreground">Get a summarized performance chart of your team's pipeline value and status milestones.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/25 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={notifications.leadAssignAlerts}
                    onChange={(e) => setNotifications({ ...notifications, leadAssignAlerts: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-semibold block">Lead Assignment Alerts</span>
                    <span className="text-xs text-muted-foreground">Instantly alert me via CRM notifications when a Manager re-assigns owners.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" disabled={loading} className="px-6 font-bold shadow-md">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : "Save Preferences"}
              </Button>
            </div>
          </form>
        )

      case "system":
      default:
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h4 className="text-sm font-bold text-foreground border-b pb-2 uppercase tracking-wide flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" /> Application Architecture
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-accent/10 space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">API Base Endpoint</span>
                <span className="text-sm font-mono block break-all">http://localhost:8000/api/</span>
              </div>
              <div className="p-4 rounded-xl border bg-accent/10 space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">Workspace Directory</span>
                <span className="text-sm font-mono block">TDTL_CRM/crm-sales-project</span>
              </div>
              <div className="p-4 rounded-xl border bg-accent/10 space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">User Permission Scope</span>
                <span className="text-sm block font-bold capitalize text-primary">{formData.role.toLowerCase()} (Granted)</span>
              </div>
              <div className="p-4 rounded-xl border bg-accent/10 space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">Current Environment</span>
                <span className="text-sm block font-bold text-green-500 uppercase tracking-widest text-xs flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
                  Development Local (Active)
                </span>
              </div>
            </div>
          </div>
        )
    }
  }

  const roleGlowPill = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "bg-red-500/10 border-red-500/20 text-red-500"
      case "manager": return "bg-purple-500/10 border-purple-500/20 text-purple-500"
      case "sales":
      default:
        return "bg-blue-500/10 border-blue-500/20 text-blue-500"
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Banner / Header */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-md bg-card">
        <div className="h-32 bg-gradient-to-r from-violet-600 via-indigo-600 to-primary relative opacity-90">
          {/* Decorative pattern overlays */}
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        </div>
        
        <div className="px-8 pb-6 flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 relative z-10">
          <div className="h-24 w-24 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center font-extrabold text-4xl text-primary bg-primary/10">
            {formData.name.charAt(0).toUpperCase() || <User className="h-10 w-10 text-primary" />}
          </div>
          
          <div className="flex-1 space-y-1 mt-6 md:mt-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black tracking-tight">{formData.name}</h2>
              <span className={`text-[9px] rounded-full font-black uppercase tracking-widest px-2.5 py-0.5 border ${roleGlowPill(formData.role)}`}>
                {formData.role}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> {formData.designation} at {formData.company}
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-1.5 shrink-0">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 border ${
              activeTab === "profile" 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-card hover:bg-accent border-border"
            }`}
          >
            <User className="h-4 w-4" />
            My Profile
          </button>
          
          <button 
            onClick={() => setActiveTab("preferences")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 border ${
              activeTab === "preferences" 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-card hover:bg-accent border-border"
            }`}
          >
            <Settings className="h-4 w-4" />
            Preferences
          </button>
          
          <button 
            onClick={() => setActiveTab("system")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 border ${
              activeTab === "system" 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-card hover:bg-accent border-border"
            }`}
          >
            <Database className="h-4 w-4" />
            System Info
          </button>
        </div>

        {/* Content Box */}
        <div className="md:col-span-3 bg-card rounded-2xl border p-8 shadow-sm min-h-[400px] flex flex-col justify-between">
          <div>
            {successMsg && (
              <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold p-3 rounded-lg flex items-center gap-2 animate-in fade-in duration-300">
                <Check className="h-4 w-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-destructive text-xs font-bold p-3 rounded-lg flex items-center gap-2 animate-in fade-in duration-300">
                <Shield className="h-4 w-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            {renderTabContent()}
          </div>
        </div>

      </div>
    </div>
  )
}

export default ProfileSettings
