"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { Status, Task } from "@repo/core"

import { Column } from "./Column"
import { Card } from "./Card"
import { COLUMNS } from "./constants"

interface KanbanBoardProps {
  tasks: Task[]
  boardId: string
  onMove: (taskId: string, newStatus: Status) => void
  getTasksByStatus: (status: Status) => Task[]
}

export function KanbanBoard({
  tasks,
  boardId,
  onMove,
  getTasksByStatus,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const handleDragStart = (event: {
    active: { data: { current?: { task?: Task } } }
  }) => {
    const task = event.active.data.current?.task
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as Status

    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== newStatus) {
      onMove(taskId, newStatus)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            title={column.title}
            dotClass={column.dotClass}
            tasks={getTasksByStatus(column.id)}
            boardId={boardId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <Card task={activeTask} boardId={boardId} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
