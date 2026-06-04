import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Users, Mail, MapPin, TrendingUp, Briefcase, AlertCircle, 
  RefreshCw, UserPlus, Search
} from "lucide-react"
import { userAPI, dashboardAPI } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"

const ManagersList = () => {
  const navigate = useNavigate()
  const [managers, setManagers] = useState([])
  const [filteredManagers, setFilteredManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dashboardData, setDashboardData] = useState(null)

  const fetchManagers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch users with manager role
      const response = await userAPI.list({ role: "MANAGER" })
      const managersData = response.data.results || response.data || []
      
      // Fetch admin dashboard to get managers with team stats
      const dashRes = await dashboardAPI.adminSummary()
      setDashboardData(dashRes.data)
      
      // Merge data if possible
      const managersWithStats = managersData.map(manager => {
        const stats = dashRes.data.managers?.find(m => m.id === manager.id)
        return {
          ...manager,
          ...(stats || {})
        }
      })
      
      setManagers(managersWithStats)
      setFilteredManagers(managersWithStats)
    } catch (err) {
      console.error("Failed to fetch managers:", err)
      setError("Failed to load managers. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchManagers()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredManagers(managers)
      return
    }
    
    const query = searchQuery.toLowerCase().trim()
    const filtered = managers.filter(manager => {
      const name = (manager.name || `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || '').toLowerCase()
      const email = (manager.email || '').toLowerCase()
      const region = (manager.region || '').toLowerCase()
      
      return name.includes(query) || 
             email.includes(query) || 
             region.includes(query)
    })
    setFilteredManagers(filtered)
  }, [searchQuery, managers])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">
            Loading Manager Profiles...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            Regional Managers Directory
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor regional sales managers across all territories.
          </p>
        </div>
        <Button 
          onClick={fetchManagers}
          className="flex items-center gap-2 font-bold px-4"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {dashboardData && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Managers</h3>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{dashboardData.overview?.totalManagers || 0}</div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Global Revenue</h3>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{dashboardData.overview?.totalGlobalRevenue || "₹0"}</div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Sales Reps</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{dashboardData.overview?.totalSalesReps || 0}</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text"
            placeholder="Search by name, email, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Managers Grid */}
      {filteredManagers.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed bg-muted/20">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">
            {searchQuery ? "No managers match your search criteria." : "No managers found in the system."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredManagers.map((manager) => (
            <div 
              key={manager.id} 
              className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-extrabold text-xl">
                  {(manager.name || manager.first_name || manager.email)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">
                    {manager.name || `${manager.first_name || ""} ${manager.last_name || ""}`.trim() || "Unnamed Manager"}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {manager.email}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="bg-muted/30 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {manager.teamSize || 0}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
                    Team Members
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-foreground">
                    {manager.revenue || "₹0"}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
                    Team Revenue
                  </div>
                </div>
              </div>

              {/* Region & Performance */}
              <div className="space-y-2 pt-2 border-t">
                {manager.region && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{manager.region}</span>
                  </div>
                )}
                {manager.performance && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className={`font-bold ${
                      manager.performance.startsWith('+') || manager.performance.startsWith('N/A')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      Performance: {manager.performance}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs font-bold hover:bg-primary/5"
                  onClick={() => {
                    const managerName = manager.name || `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || 'Manager';
                    navigate(`/team?manager=${manager.id}&name=${encodeURIComponent(managerName)}`)
                  }}
                >
                  <Users className="h-3 w-3 mr-1" />
                  View Team
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1 text-xs font-bold"
                  onClick={() => navigate(`/performance?manager=${manager.id}`)}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Reports
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManagersList
