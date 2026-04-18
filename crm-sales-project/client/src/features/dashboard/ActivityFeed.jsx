import React from "react"
import { Phone, Mail, Calendar, Info, ChevronRight } from "lucide-react"
import { useStore } from "../../store/state"

const ActivityFeed = () => {
  const { activities } = useStore()

  const getActivityIcon = (type) => {
    switch (type) {
      case "call": return { icon: Phone, color: "bg-blue-500/10 text-blue-500" }
      case "email": return { icon: Mail, color: "bg-purple-500/10 text-purple-500" }
      case "meeting": return { icon: Calendar, color: "bg-orange-500/10 text-orange-500" }
      default: return { icon: Info, color: "bg-muted text-muted-foreground" }
    }
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, idx) => {
        const { icon: Icon, color } = getActivityIcon(activity.type)
        return (
          <div key={activity.id} className="relative pl-8 group cursor-pointer">
            {/* Timeline connector line */}
            {idx !== activities.length - 1 && (
              <div className="absolute left-[15px] top-6 bottom-[-24px] w-[2px] bg-border/40 group-hover:bg-primary/20 transition-colors" />
            )}
            
            <div className={`absolute left-0 top-1 p-1.5 rounded-full z-10 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex flex-col gap-1 p-3 rounded-lg hover:bg-accent/30 transition-all border border-transparent hover:border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold capitalize text-foreground">{activity.type} with {activity.contact}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{activity.date}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {activity.desc}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                VIEW DETAILS <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        )
      })}

      {activities.length === 0 && (
        <div className="py-10 text-center text-muted-foreground italic text-sm">
          No interaction history logged yet.
        </div>
      )}
    </div>
  )
}

export default ActivityFeed
