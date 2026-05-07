"use client"

import { useState } from "react"
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Column, Task } from "@/server"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Props {
  columns: Column[]
  tasks: Task[]
  onColumnsChange: (next: Column[]) => void
  onEdit: (column: Column) => void
  onDelete: (column: Column) => void
}

export function ZenBoardFlowList({
  columns,
  tasks,
  onColumnsChange,
  onEdit,
  onDelete,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const [savingOrder, setSavingOrder] = useState(false)

  const tasksByColumn = (columnId: string) =>
    tasks.filter((t) => t.columnId === columnId).length

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = columns.findIndex((c) => c.id === active.id)
    const newIndex = columns.findIndex((c) => c.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(columns, oldIndex, newIndex)
    onColumnsChange(reordered)

    setSavingOrder(true)
    try {
      const res = await fetch(`/api/columns/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((c) => c.id) }),
      })
      if (!res.ok) throw new Error("Failed to reorder")
    } catch {
      onColumnsChange(columns)
      toast.error("No se pudo guardar el orden")
    } finally {
      setSavingOrder(false)
    }
  }

  if (columns.length === 0) {
    return (
      <div className="border-border/60 text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center text-sm">
        Aún no tienes columnas configuradas.
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={columns.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className={cn("flex flex-col gap-2", savingOrder && "opacity-80")}>
          {columns.map((column) => (
            <SortableRow
              key={column.id}
              column={column}
              taskCount={tasksByColumn(column.id)}
              onEdit={() => onEdit(column)}
              onDelete={() => onDelete(column)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

interface SortableRowProps {
  column: Column
  taskCount: number
  onEdit: () => void
  onDelete: () => void
}

function SortableRow({ column, taskCount, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-border/60 bg-background flex items-center gap-3 rounded-lg border p-3",
        isDragging && "opacity-60 shadow-lg"
      )}
    >
      <button
        type="button"
        aria-label={`Reordenar ${column.name}`}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span
        className={cn("size-3 rounded-full shrink-0", column.color)}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-foreground truncate text-sm font-medium">
            {column.name}
          </span>
          {column.isClosed && (
            <Badge variant="secondary" className="shrink-0">
              Cerrada
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground font-mono text-[10px]">
          {taskCount} {taskCount === 1 ? "task" : "tasks"}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Editar ${column.name}`}
        onClick={onEdit}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Eliminar ${column.name}`}
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  )
}
