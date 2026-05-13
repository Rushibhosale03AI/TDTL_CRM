import React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, 
  Users, 
  GitBranch, 
  Contact, 
  Settings, 
  LogOut,
  Briefcase
} from "lucide-react"
import { cn } from "../ui/Button"
import { useAuth } from "../../hooks/useAuth"

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Define nav items based on role
  const getNavItems = () => {
    if (!user) return []

    switch (user.role) {
      case 'admin':
        return [
          { title: "System Dashboard", icon: LayoutDashboard, href: "/dashboard" },
          { title: "Managers", icon: Briefcase, href: "/managers" },
          { title: "Global Reports", icon: GitBranch, href: "/reports" },
        ]
      case 'manager':
        return [
          { title: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
          { title: "Team Members", icon: Users, href: "/team" },
          { title: "Performance", icon: GitBranch, href: "/performance" },
        ]
      case 'sales':
      default:
        return [
          { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
          { title: "Leads", icon: Users, href: "/leads" },
          { title: "Pipeline", icon: GitBranch, href: "/pipeline" },
          { title: "Contacts", icon: Contact, href: "/contacts" },
        ]
    }
  }

  const navItems = getNavItems()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card flex flex-col">
      <div className="flex h-16 items-center border-bottom px-6">
        <span className="text-xl font-bold text-primary">CRM TDTL</span>
        {user && (
          <span className="ml-auto text-xs rounded bg-primary/10 px-2 py-1 text-primary font-medium uppercase tracking-wider">
            {user.role}
          </span>
        )}
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => (
          <Link
            key={item.title}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              location.pathname === item.href 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4 space-y-1">
        {user && (
          <div className="mb-4 px-3 py-2 text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
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
