import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DollarSign, Calendar, Building2 } from "lucide-react"

const DealCard = ({ lead }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "ring-2 ring-primary border-transparent" : "border-border"
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-2">
            {lead.name}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{lead.company}</span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
          <div className="flex items-center gap-1 text-sm font-bold text-primary">
            <DollarSign className="h-3.5 w-3.5" />
            {Number(lead.value).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <Calendar className="h-3 w-3" />
            {lead.date}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DealCard
