import React from "react"
import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react"
import { useStore } from "../../store/state"

const TaskPanel = () => {
  const { tasks, toggleTask } = useStore()

  // Sorted by uncompleted and descending ID
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return b.id - a.id
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "text-destructive"
      case "Medium": return "text-yellow-500"
      case "Low": return "text-green-500"
      default: return "text-muted-foreground"
    }
  }

  return (
    <div className="space-y-4">
      {sortedTasks.map((task) => (
        <div 
          key={task.id} 
          className={`group flex items-center justify-between gap-4 rounded-lg border p-3 transition-all hover:border-primary/50 ${
            task.completed ? "bg-muted/30 opacity-60" : "bg-card shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <button 
              onClick={() => toggleTask(task.id)}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
            >
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            <div className="flex flex-col overflow-hidden">
              <span className={`text-sm font-medium truncate ${task.completed ? "line-through" : ""}`}>
                {task.title}
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                  <Clock className="h-3 w-3" />
                  Due: {task.dueDate}
                </span>
                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${getPriorityColor(task.priority)}`}>
                  <AlertTriangle className="h-3 w-3" />
                  {task.priority}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {tasks.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground italic">
          No tasks for today. Relax!
        </div>
      )}
    </div>
  )
}

export default TaskPanel
