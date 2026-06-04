import React, { useState } from "react"
import { X, Calendar, Clock, User as UserIcon } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { useTasks } from "../../hooks/useTasks"
import { useAuth } from "../../hooks/useAuth"
import { useUsers } from "../../hooks/useUsers"

const TaskForm = ({ isOpen, onClose }) => {
  const { createTask } = useTasks()
  const { user: currentUser } = useAuth()
  const { users } = useUsers()
  
  const isManagerOrAdmin = currentUser?.role?.toUpperCase() === "MANAGER" || currentUser?.role?.toUpperCase() === "ADMIN"
  const salesReps = Array.isArray(users) ? users.filter(u => u.role?.toUpperCase() === "SALES") : []

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    estimatedHours: 1,
    priority: "MEDIUM",
    assignedTo: currentUser?.id,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await createTask(formData)
      if (result) {
        onClose()
      } else {
        alert("Failed to create task. Please check your data.")
      }
    } catch (err) {
      console.error("Task creation error:", err)
      alert("An error occurred while creating the task.")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-card p-8 rounded-3xl shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Create Mission</h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Assign tasks and track progress</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Task Title</label>
            <Input
              required
              placeholder="e.g. Q4 Strategy Call with Stakeholders"
              className="h-12 text-base font-bold bg-muted/30 border-none focus-visible:ring-primary/20"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description (Optional)</label>
            <textarea
              className="w-full min-h-[100px] p-4 rounded-xl bg-muted/30 border-none text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              placeholder="Provide more context about this task..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Start Date
              </label>
              <Input
                type="date"
                required
                className="bg-muted/30 border-none h-11 font-bold"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Due Date
              </label>
              <Input
                type="date"
                required
                className="bg-muted/30 border-none h-11 font-bold border-l-2 border-primary/20"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3" /> Hours Est.
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                required
                className="bg-muted/30 border-none h-11 font-bold"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Priority</label>
              <select
                className="flex h-11 w-full rounded-xl bg-muted/30 border-none px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="HIGH">CRITICAL</option>
                <option value="MEDIUM">IMPORTANT</option>
                <option value="LOW">ROUTINE</option>
              </select>
            </div>
          </div>

          {isManagerOrAdmin && (
            <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
              <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <UserIcon className="h-3 w-3" /> Assign To Representative
              </label>
              <select
                className="flex h-12 w-full rounded-xl bg-primary/5 border-2 border-primary/10 px-4 py-2 text-sm font-bold outline-none focus:border-primary/30"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <option value={currentUser?.id}>Me ({currentUser?.name})</option>
                <optgroup label="Available Sales Team">
                  {salesReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name || rep.email}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          <div className="pt-6 flex gap-4">
            <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl font-bold" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">
              Launch Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm
