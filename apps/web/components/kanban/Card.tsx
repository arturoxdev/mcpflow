"use client"

import Link from "next/link"
import { useDraggable } from "@dnd-kit/core"
import { Task } from "@repo/core"

import { cn } from "@/lib/utils"
import { PriorityGlyph } from "./PriorityGlyph"

interface CardProps {
  task: Task
  boardId: string
  boardName?: string
}

export function Card({ task, boardId, boardName }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    })

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {}

  const prPadded = String(task.pr).padStart(3, "0")

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div
        className={cn(
          "bg-card border-border hover:border-ring focus-within:border-ring relative cursor-grab rounded-lg border p-3 transition-colors active:cursor-grabbing",
          isDragging && "opacity-50"
        )}
      >
        <Link
          href={`/boards/${boardId}/tasks/${task.id}`}
          className="hover:text-primary block rounded-sm text-sm leading-tight font-medium outline-none transition-colors before:absolute before:inset-0 before:content-[''] focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {task.title}
        </Link>

        <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
          <PriorityGlyph priority={task.priority} />
          {boardName && <span className="truncate">{boardName}</span>}
          <span className="bg-border h-2.5 w-px" />
          <span className="font-mono">#PR-{prPadded}</span>
        </div>
      </div>
    </div>
  )
}
