"use client"

import { useDraggable, useDroppable } from "@dnd-kit/core"
import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { PriorityGlyph } from "@/components/kanban/PriorityGlyph"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Board, TaskWithBoard } from "@/server"

const STORAGE_KEY = "zenboard.sprint.poolPanel.open"

function PoolDraggableTask({ task }: { task: TaskWithBoard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `pool:${task.id}`,
      data: { task, fromPool: true },
    })

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-card border-border hover:border-ring relative cursor-grab rounded-md border p-2.5 text-sm transition-colors active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <div className="font-medium leading-tight">{task.title}</div>
      <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
        <PriorityGlyph priority={task.priority} />
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
          {task.boardName}
        </Badge>
      </div>
    </div>
  )
}

interface TaskPoolPanelProps {
  pool: TaskWithBoard[]
  boards: Board[]
}

export function TaskPoolPanel({ pool, boards }: TaskPoolPanelProps) {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === "1"
  })
  const [search, setSearch] = useState("")
  const [boardFilter, setBoardFilter] = useState<string>("all")

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0")
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pool.filter((t) => {
      if (boardFilter !== "all" && t.boardId !== boardFilter) return false
      if (q && !t.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [pool, search, boardFilter])

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: "pool" })

  if (!open) {
    return (
      <div
        ref={setDropRef}
        className={cn("self-start rounded-md", isOver && "ring-2 ring-accent")}
      >
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <ChevronRight className="size-4" />
          Pool ({pool.length})
        </Button>
      </div>
    )
  }

  return (
    <aside
      ref={setDropRef}
      className={cn(
        "bg-background flex w-72 shrink-0 flex-col gap-3 rounded-lg border p-3 transition-colors",
        isOver && "ring-1 ring-accent"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Pool
          <span className="text-muted-foreground ml-2 font-mono text-xs">
            {pool.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cerrar pool"
          onClick={() => setOpen(false)}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar..."
      />

      <Select value={boardFilter} onValueChange={(v) => setBoardFilter(v ?? "all")}>
        <SelectTrigger>
          <SelectValue placeholder="Todos los Boards" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los Boards</SelectItem>
          {boards.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-muted-foreground rounded-md border border-dashed py-8 text-center text-xs">
            No hay Tasks en el pool
          </div>
        ) : (
          filtered.map((t) => <PoolDraggableTask key={t.id} task={t} />)
        )}
      </div>
    </aside>
  )
}
