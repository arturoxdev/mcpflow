"use client"

import { use, useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { addDays } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import {
  SPRINT_DAY_KEYS,
  daysOfSprint,
  dayOfWeekKey,
  displaySprintName,
  formatSprintRange,
  fromIsoDateString,
  toIsoDateString,
  mondayOfWeek,
} from "@/lib/sprint-week"
import { sprintsStore } from "@/lib/sprints-store"
import { tasksStore } from "@/lib/tasks-store"
import { SprintDayColumn } from "@/components/sprints/SprintDayColumn"
import { SprintNameEditor } from "@/components/sprints/SprintNameEditor"
import { SprintTaskCard } from "@/components/sprints/SprintTaskCard"
import { TaskPoolPanel } from "@/components/sprints/TaskPoolPanel"
import type {
  Board,
  Column,
  Sprint,
  SprintDay,
  Task,
  TaskWithBoard,
} from "@/server"

interface SprintDetailPageProps {
  params: Promise<{ sprintId: string }>
}

export default function SprintDetailPage({ params }: SprintDetailPageProps) {
  const { sprintId } = use(params)
  const { getToken } = useAuth()

  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [pool, setPool] = useState<TaskWithBoard[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [previousSprintHasOpenTasks, setPreviousSprintHasOpenTasks] =
    useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRollingOver, setIsRollingOver] = useState(false)

  useBreadcrumb([
    { label: "Sprints", href: "/sprints" },
    { label: sprint ? displaySprintName(sprint) : "…" },
  ])

  const closedColumnIds = useMemo(
    () => new Set(columns.filter((c) => c.isClosed).map((c) => c.id)),
    [columns]
  )

  const boardNameById = useMemo(
    () => new Map(boards.map((b) => [b.id, b.name])),
    [boards]
  )

  const fetchAll = useCallback(async () => {
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [sRes, tRes, pRes, cRes, bRes] = await Promise.all([
        fetch(`/api/sprints/${sprintId}`, { headers }),
        fetch(`/api/sprints/${sprintId}/tasks`, { headers }),
        fetch(`/api/tasks/pool`, { headers }),
        fetch(`/api/columns`, { headers }),
        fetch(`/api/boards`, { headers }),
      ])
      if (!sRes.ok) {
        toast.error("Sprint no encontrado")
        return
      }
      const sData: Sprint = await sRes.json()
      setSprint(sData)
      if (tRes.ok) setTasks(await tRes.json())
      if (pRes.ok) setPool(await pRes.json())
      const cData: Column[] = cRes.ok ? await cRes.json() : []
      setColumns(cData)
      if (bRes.ok) setBoards(await bRes.json())

      // Previous Sprint with Open tasks → render rollover button. Use the
      // freshly-fetched cData rather than the `columns` state to avoid pulling
      // a stale closure (and to keep `columns` out of this callback's deps,
      // which would cause an infinite re-fetch loop).
      const allRes = await fetch(`/api/sprints`, { headers })
      if (allRes.ok) {
        const all: Sprint[] = await allRes.json()
        const prev = all
          .filter((s) => s.startDate < sData.startDate)
          .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0]
        if (prev) {
          const prevTasksRes = await fetch(
            `/api/sprints/${prev.id}/tasks`,
            { headers }
          )
          if (prevTasksRes.ok) {
            const prevTasks: Task[] = await prevTasksRes.json()
            const open = prevTasks.some(
              (t) => !closedIfKnown(t.columnId, cData)
            )
            setPreviousSprintHasOpenTasks(open)
          }
        } else {
          setPreviousSprintHasOpenTasks(false)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [getToken, sprintId])

  useEffect(() => {
    fetchAll()
    const u1 = sprintsStore.subscribe(fetchAll)
    const u2 = tasksStore.subscribe(fetchAll)
    return () => {
      u1()
      u2()
    }
  }, [fetchAll])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const callSchedule = async (
    taskId: string,
    body:
      | { sprintId: string; sprintDay: SprintDay; sprintPosition?: number }
      | { sprintId: null; sprintDay: null; sprintPosition: null }
  ) => {
    const token = await getToken()
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error ?? "Error al actualizar")
    }
    return (await res.json()) as Task
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTaskId(null)
    const { active, over } = event
    if (!over) return

    const overId = String(over.id)
    const fromPool = active.data.current?.fromPool === true
    const task = active.data.current?.task as Task | TaskWithBoard | undefined
    if (!task) return

    if (overId.startsWith("day:")) {
      const day = overId.slice(4) as SprintDay
      if (!fromPool && task.sprintDay === day) return // no-op
      // optimistic
      const taskId = task.id
      if (fromPool) {
        setPool((prev) => prev.filter((t) => t.id !== taskId))
        setTasks((prev) => [
          ...prev,
          { ...(task as Task), sprintId, sprintDay: day, sprintPosition: 9999 },
        ])
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, sprintDay: day } : t
          )
        )
      }
      try {
        const updated = await callSchedule(taskId, {
          sprintId,
          sprintDay: day,
        })
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        )
        tasksStore.notify()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al mover")
        await fetchAll()
      }
      return
    }

    if (overId === "pool") {
      if (fromPool) return // no-op
      const taskId = task.id
      // optimistic
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      setPool((prev) => [
        ...prev,
        {
          ...(task as Task),
          sprintId: null,
          sprintDay: null,
          sprintPosition: null,
          boardName: boardNameById.get(task.boardId) ?? "",
        },
      ])
      try {
        await callSchedule(taskId, {
          sprintId: null,
          sprintDay: null,
          sprintPosition: null,
        })
        tasksStore.notify()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al sacar del Sprint")
        await fetchAll()
      }
    }
  }

  const handleMoveToDay = async (taskId: string, day: SprintDay) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, sprintDay: day } : t))
    )
    try {
      const updated = await callSchedule(taskId, { sprintId, sprintDay: day })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      tasksStore.notify()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al mover")
      await fetchAll()
    }
  }

  const handleRemoveFromSprint = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    if (task) {
      setPool((prev) => [
        ...prev,
        {
          ...task,
          sprintId: null,
          sprintDay: null,
          sprintPosition: null,
          boardName: boardNameById.get(task.boardId) ?? "",
        },
      ])
    }
    try {
      await callSchedule(taskId, {
        sprintId: null,
        sprintDay: null,
        sprintPosition: null,
      })
      tasksStore.notify()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al sacar")
      await fetchAll()
    }
  }

  const handleRollover = async () => {
    setIsRollingOver(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/sprints/${sprintId}/rollover`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const { moved } = await res.json()
      toast.success(
        moved === 0
          ? "Sin pendientes para mover"
          : `${moved} Task(s) movidas al pool`
      )
      tasksStore.notify()
      await fetchAll()
    } catch {
      toast.error("Error al hacer rollover")
    } finally {
      setIsRollingOver(false)
    }
  }

  if (isLoading || !sprint) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const sprintStart = fromIsoDateString(sprint.startDate)
  const days = daysOfSprint(sprintStart)
  const todayKey = (() => {
    const today = new Date()
    const monday = mondayOfWeek(today)
    if (toIsoDateString(monday) !== sprint.startDate) return null
    return dayOfWeekKey(today)
  })()

  const tasksByDay = new Map<SprintDay, Task[]>()
  for (const d of SPRINT_DAY_KEYS) tasksByDay.set(d, [])
  for (const t of tasks) {
    if (t.sprintDay) {
      const list = tasksByDay.get(t.sprintDay)
      if (list) list.push(t)
    }
  }
  for (const list of tasksByDay.values()) {
    list.sort((a, b) => (a.sprintPosition ?? 0) - (b.sprintPosition ?? 0))
  }

  const activeTask = (() => {
    if (!activeTaskId) return null
    if (activeTaskId.startsWith("pool:")) {
      const id = activeTaskId.slice(5)
      return pool.find((t) => t.id === id) ?? null
    }
    return tasks.find((t) => t.id === activeTaskId) ?? null
  })()

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <SprintNameEditor sprint={sprint} onUpdated={setSprint} />
            <div className="text-muted-foreground text-sm">
              {formatSprintRange(sprintStart)} ·{" "}
              <span className="font-mono">
                hasta {toIsoDateString(addDays(sprintStart, 6))}
              </span>
            </div>
          </div>
          {previousSprintHasOpenTasks && (
            <Button
              variant="outline"
              onClick={handleRollover}
              disabled={isRollingOver}
            >
              Pasar pendientes de la semana anterior
            </Button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 gap-4">
          <TaskPoolPanel pool={pool} boards={boards} />

          <div className="flex flex-1 gap-3 overflow-x-auto pb-3">
            {days.map(({ key, date }) => {
              const list = tasksByDay.get(key) ?? []
              return (
                <SprintDayColumn
                  key={key}
                  day={key}
                  date={date}
                  isToday={key === todayKey}
                  count={list.length}
                >
                  {list.length === 0 ? (
                    <div className="text-muted-foreground border-border flex flex-col items-center justify-center rounded-md border border-dashed py-6 text-center text-xs">
                      Vacío
                    </div>
                  ) : (
                    list.map((t) => (
                      <SprintTaskCard
                        key={t.id}
                        task={t}
                        boardName={boardNameById.get(t.boardId)}
                        isClosed={closedColumnIds.has(t.columnId)}
                        draggableId={`day:${t.id}`}
                        onMoveToDay={(d) => handleMoveToDay(t.id, d)}
                        onRemoveFromSprint={() => handleRemoveFromSprint(t.id)}
                      />
                    ))
                  )}
                </SprintDayColumn>
              )
            })}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="bg-card border-border w-[220px] rounded-lg border p-3 shadow-lg">
            <div className="text-sm font-medium">{activeTask.title}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function closedIfKnown(columnId: string, columns: Column[]): boolean {
  const c = columns.find((x) => x.id === columnId)
  return c?.isClosed ?? false
}
