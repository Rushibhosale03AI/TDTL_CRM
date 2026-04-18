import React from "react"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import DealCard from "./DealCard"

const Column = ({ id, title, leads }) => {
  const { setNodeRef } = useDroppable({ id })

  const totalValue = leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0)

  return (
    <div className="flex w-80 shrink-0 flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
            {leads.length}
          </span>
        </div>
        <div className="text-xs font-semibold text-primary">
          ${totalValue.toLocaleString()}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-[500px] flex-col gap-3 rounded-xl bg-accent/20 p-2 transition-colors hover:bg-accent/30"
      >
        <SortableContext
          id={id}
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <DealCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        
        {leads.length === 0 && (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-xs text-muted-foreground italic border-2 border-dashed border-border/50 rounded-lg">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  )
}

export default Column
