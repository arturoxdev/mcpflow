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
import type { Column as ColumnEntity, Task } from "@repo/core"

import { Card } from "@/components/kanban/Card"
import { Column } from "@/components/kanban/Column"

interface Props {
  tasks: Task[]
  columns: ColumnEntity[]
  boardNameById: Map<string, string>
  onMove: (taskId: string, newColumnId: string) => void
}

export function GeneralKanban({ tasks, columns, boardNameById, onMove }: Props) {
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

  const tasksByColumn = (columnId: string) =>
    tasks.filter((t) => t.columnId === columnId)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.name}
            dotClass={col.color}
            tasks={tasksByColumn(col.id)}
            boardId=""
            boardNameById={boardNameById}
            hideAddTask
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <Card
            task={activeTask}
            boardId={activeTask.boardId}
            boardName={boardNameById.get(activeTask.boardId)}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
