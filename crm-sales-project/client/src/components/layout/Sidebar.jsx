import React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, 
  Users, 
  GitBranch, 
  Contact, 
  Settings, 
  LogOut,
  Briefcase,
  UserCheck
} from "lucide-react"
import { useAuth } from "../../hooks/useAuth"

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Define nav items based on role
  const getNavItems = () => {
    if (!user) return []

    const userRole = user.role?.toLowerCase()
    switch (userRole) {
      case 'admin':
        return [
          { title: "System Dashboard", icon: LayoutDashboard, href: "/dashboard" },
          { title: "Approvals", icon: UserCheck, href: "/approvals" },
          { title: "Managers", icon: Briefcase, href: "/managers" },
          { title: "Evening Reports", icon: Briefcase, href: "/eod" },
          { title: "AI Copilot", icon: LayoutDashboard, href: "/ai-copilot" },
          { title: "Global Reports", icon: GitBranch, href: "/reports" },
        ]
      case 'manager':
        return [
          { title: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
          { title: "Approvals", icon: UserCheck, href: "/approvals" },
          { title: "Team Members", icon: Users, href: "/team" },
          { title: "Evening Reports", icon: Briefcase, href: "/eod" },
          { title: "Performance", icon: GitBranch, href: "/performance" },
          { title: "AI Copilot", icon: LayoutDashboard, href: "/ai-copilot" },
        ]
      case 'sales':
      default:
        return [
          { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
          { title: "Leads", icon: Users, href: "/leads" },
          { title: "Pipeline", icon: GitBranch, href: "/pipeline" },
          { title: "Contacts", icon: Contact, href: "/contacts" },
          { title: "My EOD Reports", icon: Briefcase, href: "/eod" },
          { title: "AI Copilot", icon: LayoutDashboard, href: "/ai-copilot" },
        ]
    }
  }

  const navItems = getNavItems() || []

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Simple class helper to avoid dependency issues
  const getLinkClass = (href) => {
    const base = "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
    const active = location.pathname === href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
    return `${base} ${active}`
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card/75 backdrop-blur-xl flex flex-col shadow-sm">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent tracking-tight">CRM TDTL</span>
        {user && (
          <span className="ml-auto text-[9px] rounded-full bg-primary/10 px-2 py-0.5 text-primary font-black uppercase tracking-widest border border-primary/20">
            {user.role || "User"}
          </span>
        )}
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => (
          <Link
            key={item.title}
            to={item.href}
            className={getLinkClass(item.href)}
          >
            {item.icon && <item.icon className="h-4 w-4" />}
            {item.title}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4 space-y-1">
        {user && (
          <div 
            onClick={() => navigate("/settings")}
            className="mb-4 px-3 py-2 text-sm cursor-pointer rounded-xl hover:bg-accent/40 transition-all border border-transparent hover:border-border/40"
            title="View Profile Settings"
          >
            <p className="font-bold text-foreground leading-tight">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
