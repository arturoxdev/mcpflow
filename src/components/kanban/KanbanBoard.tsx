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
import { Column as ColumnEntity, Task } from "@/server"

import { Column } from "./Column"
import { Card } from "./Card"

interface KanbanBoardProps {
  tasks: Task[]
  columns: ColumnEntity[]
  boardId: string
  onMove: (taskId: string, newColumnId: string) => void
  getTasksByColumn: (columnId: string) => Task[]
}

export function KanbanBoard({
  tasks,
  columns,
  boardId,
  onMove,
  getTasksByColumn,
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
    const newColumnId = over.id as string

    const task = tasks.find((t) => t.id === taskId)
    if (task && task.columnId !== newColumnId) {
      onMove(taskId, newColumnId)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            title={column.name}
            dotClass={column.color}
            tasks={getTasksByColumn(column.id)}
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
