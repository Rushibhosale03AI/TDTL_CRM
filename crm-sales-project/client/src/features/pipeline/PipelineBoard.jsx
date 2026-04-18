import React, { useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useStore } from "../../store/state"
import Column from "./Column"
import DealCard from "./DealCard"

const STAGES = [
  { id: "New", title: "New Lead" },
  { id: "Follow-up", title: "Follow-up" },
  { id: "Qualified", title: "Qualified" },
  { id: "Meeting", title: "Meeting" },
  { id: "Requirements", title: "Requirements" },
  { id: "Proposal", title: "Proposal" },
  { id: "Negotiation", title: "Negotiation" },
  { id: "Won", title: "Won" },
  { id: "Lost", title: "Lost" },
]

const PipelineBoard = () => {
  const { leads, moveLead } = useStore()
  const [activeLead, setActiveLead] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event) => {
    const { active } = event
    const lead = leads.find((l) => l.id === active.id)
    setActiveLead(lead)
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeLead = leads.find((l) => l.id === activeId)
    if (!activeLead) return

    // If dropping over a column or another card
    const overStage = STAGES.find(s => s.id === overId)
    const overLead = leads.find(l => l.id === overId)
    
    const newStatus = overStage ? overStage.id : (overLead ? overLead.status : null)

    if (newStatus && activeLead.status !== newStatus) {
      moveLead(activeId, newStatus)
    }
  }

  const handleDragEnd = (event) => {
    setActiveLead(null)
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Manage your deals and track progress across the sales funnel.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-6 px-1">
            {STAGES.map((stage) => (
              <Column
                key={stage.id}
                id={stage.id}
                title={stage.title}
                leads={leads.filter((l) => l.status === stage.id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? <DealCard lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

export default PipelineBoard
