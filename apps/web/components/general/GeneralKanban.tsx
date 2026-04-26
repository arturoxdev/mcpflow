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
import type { Status, Task } from "@repo/core"

import { Card } from "@/components/kanban/Card"
import { Column } from "@/components/kanban/Column"
import { COLUMNS } from "@/components/kanban/constants"

interface Props {
  tasks: Task[]
  boardNameById: Map<string, string>
  onMove: (taskId: string, newStatus: Status) => void
}

export function GeneralKanban({ tasks, boardNameById, onMove }: Props) {
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

  const tasksByStatus = (s: Status) => tasks.filter((t) => t.status === s)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.title}
            dotClass={col.dotClass}
            tasks={tasksByStatus(col.id)}
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
