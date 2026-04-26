"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, Plus } from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { Status, Task } from "@repo/core"

import { PriorityGlyph } from "@/components/kanban/PriorityGlyph"
import { cn } from "@/lib/utils"
import { StatusGlyph } from "./StatusGlyph"

interface BoardListProps {
  tasks: Task[]
  boardId?: string
  boardNameById?: Map<string, string>
  onMove?: (taskId: string, newStatus: Status) => void
}

const SECTIONS: {
  id: Status
  name: string
  dotClass: string
  defaultOpen: boolean
}[] = [
  { id: "doing", name: "En curso", dotClass: "bg-chart-3", defaultOpen: true },
  { id: "todo", name: "Por hacer", dotClass: "bg-destructive", defaultOpen: true },
  { id: "done", name: "Hechas", dotClass: "bg-chart-4", defaultOpen: false },
]

export function BoardList({
  tasks,
  boardId,
  boardNameById,
  onMove,
}: BoardListProps) {
  const newTaskHref = boardId
    ? `/boards/tasks/new?boardId=${boardId}`
    : "/boards/tasks/new"

  const showBoardName = !!boardNameById

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
    if (!over || !onMove) return
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
      <div className="flex flex-col gap-9">
        {SECTIONS.map((section) => {
          const sectionTasks = tasks.filter((t) => t.status === section.id)
          return (
            <ListSection
              key={section.id}
              id={section.id}
              name={section.name}
              dotClass={section.dotClass}
              tasks={sectionTasks}
              defaultOpen={section.defaultOpen}
              newTaskHref={newTaskHref}
              boardNameById={boardNameById}
              showBoardName={showBoardName}
            />
          )
        })}
      </div>
      <DragOverlay>
        {activeTask ? (
          <DragRowPreview
            task={activeTask}
            boardName={
              showBoardName
                ? boardNameById?.get(activeTask.boardId)
                : undefined
            }
            showBoardName={showBoardName}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface ListSectionProps {
  id: Status
  name: string
  dotClass: string
  tasks: Task[]
  defaultOpen: boolean
  newTaskHref: string
  boardNameById?: Map<string, string>
  showBoardName: boolean
}

function ListSection({
  id,
  name,
  dotClass,
  tasks,
  defaultOpen,
  newTaskHref,
  boardNameById,
  showBoardName,
}: ListSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-lg transition-colors",
        isOver && "bg-accent/10 ring-1 ring-accent/30"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-foreground hover:text-foreground mb-2 flex w-full items-center gap-3 py-2 text-left"
      >
        <ChevronRight
          className={cn(
            "text-muted-foreground size-4 transition-transform duration-150",
            open && "rotate-90"
          )}
        />
        <span className={cn("size-1.5 rounded-full", dotClass)} />
        <span className="text-sm font-semibold tracking-tight">{name}</span>
        <span className="text-muted-foreground font-mono text-xs">
          {tasks.length}
        </span>
        <span className="bg-border ml-2 h-px flex-1" />
      </button>

      {open ? (
        <div>
          {tasks.length === 0 ? (
            <p className="border-border text-muted-foreground/70 my-2 rounded-lg border border-dashed px-4 py-6 text-center text-xs italic">
              No hay tareas en {name.toLowerCase()}.
            </p>
          ) : (
            tasks.map((task) => (
              <ListRow
                key={task.id}
                task={task}
                boardName={
                  showBoardName
                    ? boardNameById?.get(task.boardId)
                    : undefined
                }
                showBoardName={showBoardName}
              />
            ))
          )}
          <Link
            href={newTaskHref}
            className="border-border text-muted-foreground hover:border-ring hover:text-foreground mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-xs transition-colors"
          >
            <Plus className="size-3.5" />
            Añadir tarea a {name.toLowerCase()}
          </Link>
        </div>
      ) : (
        isOver && (
          <p className="text-accent/80 mt-1 px-3 pb-2 text-xs italic">
            Soltar para mover a {name.toLowerCase()}
          </p>
        )
      )}
    </section>
  )
}

interface ListRowProps {
  task: Task
  boardName?: string
  showBoardName: boolean
}

function ListRow({ task, boardName, showBoardName }: ListRowProps) {
  const isDone = task.status === "done"
  const prPadded = String(task.pr).padStart(3, "0")
  const href = `/boards/${task.boardId}/tasks/${task.id}`

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    })

  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {}

  const gridTemplate = showBoardName
    ? "1.5rem minmax(0,1fr) auto auto auto auto"
    : "1.5rem minmax(0,1fr) auto auto auto"

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, gridTemplateColumns: gridTemplate }}
      {...listeners}
      {...attributes}
      className={cn(
        "border-border/60 hover:bg-muted/40 focus-within:bg-muted/40 relative grid cursor-grab items-center gap-4 border-b px-2 py-3 transition-colors active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <StatusGlyph status={task.status} />
      <Link
        href={href}
        className="text-foreground rounded-sm outline-none before:absolute before:inset-0 before:content-[''] focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span
          className={cn(
            "text-sm leading-snug",
            isDone &&
              "text-muted-foreground decoration-muted-foreground/60 line-through"
          )}
        >
          {task.title}
        </span>
      </Link>
      <PriorityGlyph priority={task.priority} />
      {showBoardName && (
        <span className="text-muted-foreground/70 font-mono text-xs">
          {boardName ?? ""}
        </span>
      )}
      <span className="bg-border h-3 w-px" />
      <span className="text-muted-foreground font-mono text-xs">
        #PR-{prPadded}
      </span>
    </div>
  )
}

interface DragRowPreviewProps {
  task: Task
  boardName?: string
  showBoardName: boolean
}

function DragRowPreview({
  task,
  boardName,
  showBoardName,
}: DragRowPreviewProps) {
  const prPadded = String(task.pr).padStart(3, "0")
  return (
    <div className="bg-card border-border ring-foreground/5 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm shadow-lg ring-1">
      <StatusGlyph status={task.status} />
      <span className="text-foreground truncate font-medium">{task.title}</span>
      <PriorityGlyph priority={task.priority} className="ml-auto" />
      {showBoardName && boardName && (
        <span className="text-muted-foreground/70 font-mono text-xs">
          {boardName}
        </span>
      )}
      <span className="text-muted-foreground font-mono text-xs">
        #PR-{prPadded}
      </span>
    </div>
  )
}
