"use client"

import { useDraggable } from "@dnd-kit/core"
import { MoreHorizontal } from "lucide-react"

import { PriorityGlyph } from "@/components/kanban/PriorityGlyph"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { SPRINT_DAY_KEYS, dayLabel } from "@/lib/sprint-week"
import type { SprintDay, Task } from "@/server"

interface SprintTaskCardProps {
  task: Task
  boardName?: string
  isClosed: boolean
  draggableId: string
  onMoveToDay?: (day: SprintDay) => void
  onRemoveFromSprint?: () => void
}

export function SprintTaskCard({
  task,
  boardName,
  isClosed,
  draggableId,
  onMoveToDay,
  onRemoveFromSprint,
}: SprintTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggableId,
      data: { task },
    })

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border-border hover:border-ring relative rounded-lg border p-3 transition-colors",
        isDragging && "opacity-50",
        isClosed && "bg-muted/40"
      )}
    >
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing"
      >
        <div
          className={cn(
            "text-sm font-medium leading-tight",
            isClosed && "text-muted-foreground line-through decoration-1"
          )}
        >
          {task.title}
        </div>

        <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
          <PriorityGlyph priority={task.priority} />
          {boardName && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
              {boardName}
            </Badge>
          )}
        </div>
      </div>

      {(onMoveToDay || onRemoveFromSprint) && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Acciones"
                className="text-muted-foreground hover:text-foreground absolute top-1.5 right-1.5 rounded-sm p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent focus:opacity-100"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            }
          />
          <DropdownMenuContent align="end" onPointerDown={(e) => e.stopPropagation()}>
            {onMoveToDay && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Mover a…</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {SPRINT_DAY_KEYS.map((d) => (
                    <DropdownMenuItem
                      key={d}
                      disabled={d === task.sprintDay}
                      onSelect={() => onMoveToDay(d)}
                    >
                      {dayLabel(d)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {onMoveToDay && onRemoveFromSprint && <DropdownMenuSeparator />}
            {onRemoveFromSprint && (
              <DropdownMenuItem onSelect={onRemoveFromSprint}>
                Quitar del Sprint
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
