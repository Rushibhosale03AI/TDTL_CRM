import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useDashboard } from "../../hooks/useDashboard"
import { useTeams } from "../../hooks/useTeams"
import { Mail, Phone, User as UserIcon, Shield, TrendingUp, MoreVertical, LayoutGrid, Users as UsersIcon, Trash2, Plus, Filter, X } from "lucide-react"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { userAPI } from "../../services/api"
import TeamForm from "./TeamForm"

const TeamList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: dashboardData, loading: dashLoading } = useDashboard()
  const { fetchTeams, deleteTeam } = useTeams()
  
  const [view, setView] = useState("members") // "members" or "teams"
  const [teams, setTeams] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Get manager filter from URL
  const managerIdFilter = searchParams.get('manager')
  const managerNameFilter = searchParams.get('name')

  const loadTeams = async () => {
    setLoadingTeams(true)
    const data = await fetchTeams()
    setTeams(data)
    setLoadingTeams(false)
  }

  const loadTeamMembers = async () => {
    try {
      setLoadingMembers(true)
      let membersData = []
      
      // First priority: Use dashboard team performance data
      if (dashboardData?.teamPerformance && dashboardData.teamPerformance.length > 0) {
        membersData = dashboardData.teamPerformance
      } else {
        // Fallback: Try to fetch sales reps from users API
        try {
          const response = await userAPI.list({ role: "SALES_REP" })
          membersData = response.data.results || response.data || []
        } catch (err) {
          console.warn("Could not fetch sales reps:", err)
        }
      }
      
      // Filter by manager if specified
      let filtered = membersData
      if (managerIdFilter && membersData.length > 0) {
        filtered = membersData.filter(member => 
          String(member.managerId) === managerIdFilter || 
          String(member.manager_id) === managerIdFilter ||
          String(member.manager?.id) === managerIdFilter ||
          String(member.manager) === managerIdFilter
        )
      }
      
      setTeamMembers(filtered)
    } catch (err) {
      console.error("Failed to load team members:", err)
      setTeamMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    loadTeamMembers()
  }, [dashboardData, managerIdFilter])

  const loading = dashLoading || loadingTeams || loadingMembers

  const clearFilter = () => {
    setSearchParams({})
  }

  const handleDeleteTeam = async (id) => {
    if (window.confirm("Are you sure you want to disband this team?")) {
      const success = await deleteTeam(id)
      if (success) loadTeams()
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Organize your personnel into high-performance sales units.
          </p>
          {managerIdFilter && managerNameFilter && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-bold flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Filtered by Manager: {decodeURIComponent(managerNameFilter)}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilter}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-xl p-1">
            <Button 
              variant={view === "members" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setView("members")}
              className="h-9 px-4 rounded-lg font-bold flex items-center gap-2"
            >
              <UsersIcon className="h-4 w-4" /> Members
            </Button>
            <Button 
              variant={view === "teams" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setView("teams")}
              className="h-9 px-4 rounded-lg font-bold flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" /> Teams
            </Button>
          </div>
          <Button 
            className="font-bold px-6 h-11 bg-primary shadow-lg shadow-primary/20 flex items-center gap-2"
            onClick={() => {
              console.log("Opening Create Team Modal");
              setIsTeamModalOpen(true);
            }}
          >
            <Plus className="h-5 w-5" />
            Create Team
          </Button>
        </div>
      </div>

      {view === "members" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-2xl border bg-card animate-pulse" />
            ))
          ) : teamMembers.length === 0 ? (
            <div className="col-span-full py-20 text-center rounded-2xl border border-dashed bg-muted/20">
              <p className="text-muted-foreground font-medium">No team members found.</p>
            </div>
          ) : (
            teamMembers.map((member) => (
              <div key={member.id} className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                {/* ... existing member card content ... */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-xl font-black border border-primary/10">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{member.name}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                        <Shield className="h-3 w-3" />
                        {member.role || "Sales Rep"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pipeline</p>
                    <p className="text-sm font-black text-foreground">{member.activePipeline || "$0"}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Conversion</p>
                    <p className="text-sm font-black text-primary">{member.conversionRate || "0%"}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Revenue: {member.revenue}</span>
                    <span className="text-foreground">{member.targetProgress || 0}% of Target</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${member.targetProgress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t flex items-center justify-between">
                  <div className="flex flex-col text-[10px] font-bold text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {member.email}</span>
                  </div>
                  <Button variant="link" className="text-xs font-black uppercase text-primary p-0 h-auto flex items-center gap-1 group/btn">
                    Stats <TrendingUp className="h-3 w-3 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {loading ? (
            [1, 2].map(i => (
              <div key={i} className="h-64 rounded-2xl border bg-card animate-pulse" />
            ))
          ) : teams.length === 0 ? (
            <div className="col-span-full py-20 text-center rounded-2xl border border-dashed bg-muted/20">
              <p className="text-muted-foreground font-medium">No sales teams created yet. Build your first team!</p>
            </div>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="rounded-2xl border bg-card overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all">
                <div className="p-6 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-xl text-primary">{team.name}</h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                      Head: {team.manager_name || "Assigned Manager"}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Team Roster</span>
                    <Badge variant="outline" className="text-[9px] font-black">{team.members?.length || 0} MEMBERS</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {team.members_detail?.slice(0, 8).map((m, idx) => (
                      <div key={idx} className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-black -ml-2 first:ml-0 shadow-sm" title={m.name}>
                        {m.name?.charAt(0) || "U"}
                      </div>
                    ))}
                    {(team.members_detail?.length > 8) && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[10px] font-black -ml-2 text-primary">
                        +{team.members_detail.length - 8}
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-muted-foreground italic">Current activity level</span>
                      <span className="text-emerald-500 uppercase">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <TeamForm 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)} 
        onRefresh={loadTeams}
      />
    </div>
  )
}

export default TeamList
