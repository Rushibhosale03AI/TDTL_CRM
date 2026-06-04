import React, { useState } from "react"
import { 
  CheckCircle2, Circle, Clock, AlertTriangle, User, Calendar, Info, 
  Columns, List, CalendarDays, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft 
} from "lucide-react"
import { useTasks } from "../../hooks/useTasks"
import { useAuth } from "../../hooks/useAuth"
import { useUsers } from "../../hooks/useUsers"
import DetailModal from "../../components/ui/DetailModal"
import { Badge } from "../../components/ui/Badge"

const TaskPanel = () => {
  const { tasks, updateTask } = useTasks()
  const { user } = useAuth()
  const { users } = useUsers()
  
  const [viewMode, setViewMode] = useState("list") // list, kanban, calendar
  const [selectedTask, setSelectedTask] = useState(null)
  
  // Kanban column active view inside narrow panel
  const [activeKanbanCol, setActiveKanbanCol] = useState("todo") // todo, in_progress, completed
  
  // Calendar active view states
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date())

  // Sorting: uncompleted first, then by descending ID
  const sortedTasks = Array.isArray(tasks) ? [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return b.id - a.id
  }) : []

  const handleToggle = (e, task) => {
    e.stopPropagation()
    const nextStatus = task.status === "completed" ? "todo" : "completed"
    updateTask(task.id, { 
      completed: !task.completed,
      status: nextStatus,
      progressPercentage: nextStatus === "completed" ? 100 : 0
    })
  }

  const handleMoveStatus = (task, newStatus) => {
    const isCompleted = newStatus === "completed"
    updateTask(task.id, {
      status: newStatus,
      completed: isCompleted,
      progressPercentage: newStatus === "completed" ? 100 : newStatus === "in_progress" ? 50 : 0
    })
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case "URGENT": return "text-red-500 bg-red-500/10 font-bold border border-red-500/20"
      case "HIGH": return "text-orange-500 bg-orange-500/10 font-bold border border-orange-500/20"
      case "MEDIUM": return "text-yellow-500 bg-yellow-500/10 font-medium border border-yellow-500/20"
      case "LOW": return "text-green-500 bg-green-500/10 border border-green-500/20"
      default: return "text-muted-foreground bg-muted/40"
    }
  }
  
  const getAssignedName = (id) => {
    if (id === user?.id) return "You"
    const found = Array.isArray(users) ? users.find(u => u.id === id) : null
    return found ? found.name : "Unknown"
  }

  // Monthly Calendar cells
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const days = new Date(year, month + 1, 0).getDate()
    const firstDayIndex = new Date(year, month, 1).getDay()
    
    const calendarCells = []
    // Empty prefix cells
    for (let i = 0; i < firstDayIndex; i++) {
      calendarCells.push(null)
    }
    // Days of month
    for (let day = 1; day <= days; day++) {
      calendarCells.push(new Date(year, month, day))
    }
    return calendarCells
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const calendarDays = getDaysInMonth(currentDate)

  // Filter tasks based on selected day in Calendar Agenda View
  const getTasksForDate = (date) => {
    const dateString = date.toISOString().split("T")[0]
    return sortedTasks.filter(t => {
      const taskDate = t.dueDate?.split("T")[0] || t.startDate?.split("T")[0]
      return taskDate === dateString
    })
  }

  const selectedDateTasks = getTasksForDate(selectedCalendarDate)

  const taskFields = [
    { key: "title", label: "Task Title", icon: Info },
    { key: "description", label: "Description", icon: Info },
    { 
      key: "startDate", 
      label: "Start Date", 
      icon: Calendar,
      format: (val) => val ? new Date(val).toLocaleDateString() : "Not set"
    },
    { 
      key: "dueDate", 
      label: "Due Date", 
      icon: Clock,
      format: (val) => new Date(val).toLocaleDateString()
    },
    { 
      key: "estimatedHours", 
      label: "Estimated Hours", 
      icon: Clock,
      format: (val) => `${val} Hours`
    },
    { 
      key: "priority", 
      label: "Priority Level", 
      icon: AlertTriangle,
      format: (val) => val?.toUpperCase()
    },
    { 
      key: "assignedTo", 
      label: "Assigned To", 
      icon: User,
      format: (val) => getAssignedName(val)
    },
    { 
      key: "status", 
      label: "Task Status", 
      icon: Info,
      format: (val) => val?.replace("_", " ")?.toUpperCase()
    },
  ]

  // Counts for Kanban Board columns
  const todoTasks = sortedTasks.filter(t => t.status === "todo" || (!t.status && !t.completed))
  const inProgressTasks = sortedTasks.filter(t => t.status === "in_progress")
  const completedTasks = sortedTasks.filter(t => t.status === "completed" || t.completed)

  return (
    <div className="space-y-4">
      {/* View Selector header bar */}
      <div className="flex justify-between items-center bg-muted/30 p-1 rounded-xl border border-border/50 shrink-0">
        <div className="flex gap-0.5 w-full">
          <button 
            onClick={() => setViewMode("list")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              viewMode === "list" ? "bg-card shadow-sm text-primary border border-border/20" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-3 w-3" />
            List
          </button>
          <button 
            onClick={() => setViewMode("kanban")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              viewMode === "kanban" ? "bg-card shadow-sm text-primary border border-border/20" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Columns className="h-3 w-3" />
            Kanban
          </button>
          <button 
            onClick={() => setViewMode("calendar")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              viewMode === "calendar" ? "bg-card shadow-sm text-primary border border-border/20" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            Calendar
          </button>
        </div>
      </div>

      {/* VIEW: List view (Clean alignment, perfect paddings) */}
      {viewMode === "list" && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          {sortedTasks.map((task) => (
            <div 
              key={task.id} 
              className={`group flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all hover:border-primary/50 cursor-pointer ${
                task.completed ? "bg-muted/10 opacity-60" : "bg-card shadow-sm hover:shadow-md"
              }`}
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                <button 
                  onClick={(e) => handleToggle(e, task)}
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5.5 w-5.5 text-green-500" />
                  ) : (
                    <Circle className="h-5.5 w-5.5" />
                  )}
                </button>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-xs font-bold truncate block ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                    <span className="flex items-center gap-0.5 shrink-0">
                      <Calendar className="h-2.5 w-2.5" />
                      {new Date(task.startDate || task.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-0.5 shrink-0 text-primary">
                      <Clock className="h-2.5 w-2.5" />
                      {task.estimatedHours}h
                    </span>
                    <span className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] tracking-widest uppercase shrink-0 font-extrabold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {sortedTasks.length === 0 && (
            <div className="py-10 text-center text-xs text-muted-foreground italic">
              No tasks found.
            </div>
          )}
        </div>
      )}

      {/* VIEW: Kanban Board (Segment Switcher fits narrow space perfectly!) */}
      {viewMode === "kanban" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Segment selection buttons */}
          <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/30">
            <button 
              onClick={() => setActiveKanbanCol("todo")}
              className={`flex-1 text-center py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                activeKanbanCol === "todo" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>To Do</span>
              <span className="bg-muted px-1 py-0.25 rounded text-[8px] font-black">{todoTasks.length}</span>
            </button>
            <button 
              onClick={() => setActiveKanbanCol("in_progress")}
              className={`flex-1 text-center py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                activeKanbanCol === "in_progress" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Active</span>
              <span className="bg-primary-foreground/20 px-1 py-0.25 rounded text-[8px] font-black">{inProgressTasks.length}</span>
            </button>
            <button 
              onClick={() => setActiveKanbanCol("completed")}
              className={`flex-1 text-center py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                activeKanbanCol === "completed" ? "bg-green-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Done</span>
              <span className="bg-white/20 px-1 py-0.25 rounded text-[8px] font-black">{completedTasks.length}</span>
            </button>
          </div>

          {/* Dynamic Column List Content */}
          <div className="space-y-2.5 min-h-[180px]">
            {activeKanbanCol === "todo" && (
              <>
                {todoTasks.map(task => (
                  <div key={task.id} className="bg-card border p-3 rounded-xl shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer" onClick={() => setSelectedTask(task)}>
                    <span className="text-xs font-bold text-foreground block leading-tight">{task.title}</span>
                    <div className="flex justify-between items-center gap-2">
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveStatus(task, "in_progress"); }}
                        className="p-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all hover:scale-105"
                        title="Move to In Progress"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {todoTasks.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground italic py-8">No tasks in To Do</p>
                )}
              </>
            )}

            {activeKanbanCol === "in_progress" && (
              <>
                {inProgressTasks.map(task => (
                  <div key={task.id} className="bg-card border p-3 rounded-xl shadow-sm border-l-2 border-l-primary hover:shadow-md transition-all space-y-3 cursor-pointer" onClick={() => setSelectedTask(task)}>
                    <span className="text-xs font-bold text-foreground block leading-tight">{task.title}</span>
                    <div className="flex justify-between items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveStatus(task, "todo"); }}
                        className="p-1 rounded bg-muted hover:bg-foreground hover:text-white transition-colors"
                        title="Move to To Do"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveStatus(task, "completed"); }}
                        className="p-1 rounded bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white transition-all hover:scale-105"
                        title="Mark Completed"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {inProgressTasks.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground italic py-8">No tasks in progress</p>
                )}
              </>
            )}

            {activeKanbanCol === "completed" && (
              <>
                {completedTasks.map(task => (
                  <div key={task.id} className="bg-muted/10 border p-3 rounded-xl shadow-sm space-y-3 cursor-pointer opacity-80 hover:opacity-100 transition-opacity" onClick={() => setSelectedTask(task)}>
                    <span className="text-xs font-bold text-foreground line-through block leading-tight">{task.title}</span>
                    <div className="flex justify-between items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveStatus(task, "in_progress"); }}
                        className="p-1 rounded bg-muted hover:bg-foreground hover:text-white transition-colors"
                        title="Revert to In Progress"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <span className="text-[8px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">
                        Done
                      </span>
                    </div>
                  </div>
                ))}
                {completedTasks.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground italic py-8">No completed tasks</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* VIEW: Interactive Calendar (Compact numeric grid + Clean list agenda below) */}
      {viewMode === "calendar" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-card border rounded-xl p-3 space-y-3">
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-foreground">
                {currentDate.toLocaleString("default", { month: "short", year: "numeric" })}
              </h4>
              <div className="flex gap-0.5">
                <button onClick={handlePrevMonth} className="p-1 border border-border rounded-md hover:bg-muted"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <button onClick={handleNextMonth} className="p-1 border border-border rounded-md hover:bg-muted"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-black uppercase tracking-wider text-muted-foreground pb-1">
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, idx) => {
                if (cell === null) {
                  return <div key={`empty-${idx}`} className="h-6 bg-muted/5 rounded" />
                }
                
                const isSelected = selectedCalendarDate && cell.toDateString() === selectedCalendarDate.toDateString()
                const dayTasks = getTasksForDate(cell)
                const hasTasks = dayTasks.length > 0

                return (
                  <button 
                    key={cell.toISOString()} 
                    onClick={() => setSelectedCalendarDate(cell)}
                    className={`h-6 rounded-md text-[10px] font-bold relative flex items-center justify-center transition-all ${
                      isSelected 
                        ? "bg-primary text-primary-foreground font-black shadow-smScale" 
                        : hasTasks 
                          ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20" 
                          : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <span>{cell.getDate()}</span>
                    {hasTasks && (
                      <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                        isSelected ? "bg-white" : "bg-primary"
                      }`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Agenda view for selected date */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block border-b pb-1">
              Agenda: {selectedCalendarDate.toLocaleDateString("default", { month: "short", day: "numeric" })}
            </span>
            <div className="space-y-2">
              {selectedDateTasks.map(task => (
                <div 
                  key={task.id} 
                  className="bg-card border p-2.5 rounded-lg flex items-center justify-between gap-3 shadow-xs hover:border-primary/50 cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <span className="text-xs font-bold truncate block flex-1">{task.title}</span>
                  <span className={`text-[8px] font-black uppercase px-1.25 py-0.25 rounded tracking-wide shrink-0 ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
              {selectedDateTasks.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic py-3 text-center">No tasks scheduled for this date.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      <DetailModal 
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Mission Details"
        data={selectedTask || {}}
        fields={taskFields}
      />
    </div>
  )
}

export default TaskPanel
