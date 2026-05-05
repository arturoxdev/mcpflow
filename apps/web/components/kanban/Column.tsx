"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { useDroppable } from "@dnd-kit/core"
import { Task } from "@repo/core"

import { cn } from "@/lib/utils"
import { Card } from "./Card"

interface ColumnProps {
  id: string
  title: string
  dotClass: string
  tasks: Task[]
  boardId: string
  boardNameById?: Map<string, string>
  hideAddTask?: boolean
}

export function Column({
  id,
  title,
  dotClass,
  tasks,
  boardId,
  boardNameById,
  hideAddTask = false,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const count = String(tasks.length).padStart(2, "0")
  const newTaskHref = boardId
    ? `/boards/tasks/new?boardId=${boardId}&columnId=${id}`
    : null

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <span className={cn("size-1.5 rounded-full", dotClass)} />
        <span className="text-foreground text-sm lowercase tracking-wide">
          {title}
        </span>
        <span className="text-muted-foreground font-mono text-xs">{count}</span>
        {newTaskHref && !hideAddTask && (
          <Link
            href={newTaskHref}
            aria-label={`Añadir tarea en ${title}`}
            className="text-muted-foreground hover:text-foreground ml-auto rounded-sm p-1 transition-colors"
          >
            <Plus className="size-4" />
          </Link>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2.5 rounded-lg p-1 transition-colors duration-200",
          isOver && "bg-accent/20"
        )}
      >
        {tasks.length === 0 ? (
          <div className="border-border flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground text-sm">Todo en calma</p>
            <p className="text-muted-foreground/60 font-mono text-xs">
              no hay tareas aquí
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <Card
              key={task.id}
              task={task}
              boardId={task.boardId}
              boardName={boardNameById?.get(task.boardId)}
            />
          ))
        )}
        {tasks.length > 0 && newTaskHref && !hideAddTask && (
          <Link
            href={newTaskHref}
            className="border-border text-muted-foreground hover:border-ring hover:text-foreground mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-2.5 text-xs transition-colors"
          >
            <Plus className="size-3.5" />
            Añadir tarea
          </Link>
        )}
      </div>
    </div>
  )
}
