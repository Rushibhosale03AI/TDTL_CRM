import React, { useState } from "react"
import { X, Users, Shield, Plus, Check } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { useUsers } from "../../hooks/useUsers"
import { useTeams } from "../../hooks/useTeams"

const TeamForm = ({ isOpen, onClose, onRefresh }) => {
  const { users } = useUsers()
  const { createTeam } = useTeams()
  const [teamName, setTeamName] = useState("")
  const [headId, setHeadId] = useState("")
  const [selectedMembers, setSelectedMembers] = useState([])

  const availableUsers = Array.isArray(users) ? users : []
  
  const toggleMember = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter(m => m !== id))
    } else {
      setSelectedMembers([...selectedMembers, id])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!headId) {
      alert("Please select a Team Head.")
      return
    }

    const payload = {
      name: teamName,
      manager: Number(headId),
      members: selectedMembers.map(id => Number(id))
    }

    const result = await createTeam(payload)
    if (result) {
      onRefresh()
      onClose()
      setTeamName("")
      setHeadId("")
      setSelectedMembers([])
    } else {
      alert("Failed to create team. Check permissions or data.")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-card p-8 rounded-3xl shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Create New Sales Team</h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Organize your reps under a focused lead</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Team Name</label>
            <Input
              required
              placeholder="e.g. West Coast Elites"
              className="h-12 text-base font-bold bg-muted/30 border-none"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Shield className="h-3 w-3" /> Select Team Head (Manager)
            </label>
            <select
              required
              className="flex h-12 w-full rounded-xl bg-primary/5 border-2 border-primary/10 px-4 py-2 text-sm font-bold outline-none focus:border-primary/30"
              value={headId}
              onChange={(e) => setHeadId(e.target.value)}
            >
              <option value="">Select Head...</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="h-3 w-3" /> Add Team Members (Infinite Selection)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-xl bg-muted/20">
              {availableUsers
                .filter(u => u.id !== Number(headId))
                .map(u => (
                <div 
                  key={u.id}
                  onClick={() => toggleMember(u.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedMembers.includes(u.id) 
                      ? "bg-primary border-primary text-primary-foreground shadow-md" 
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-[10px] font-bold truncate">{u.name || u.email.split('@')[0]}</span>
                  {selectedMembers.includes(u.id) && <Check className="h-3 w-3 shrink-0" />}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium italic mt-1">
              Currently {selectedMembers.length} members selected.
            </p>
          </div>

          <div className="pt-6 flex gap-4">
            <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl font-bold" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">
              Construct Team
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeamForm
