"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import type { Board, Column, Sprint, Task } from "@/server"
import { toast } from "sonner"

import { ArrowDown, ArrowUp } from "lucide-react"

import { BoardList } from "@/components/board/BoardList"
import { GeneralKanban } from "@/components/general/GeneralKanban"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { MultiSelect } from "@/components/ui/multi-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import { usePageAction } from "@/hooks/use-page-action"
import {
  displaySprintName,
  mondayOfWeek,
  toIsoDateString,
} from "@/lib/sprint-week"
import { tasksStore } from "@/lib/tasks-store"

type SortField = "priority" | "created"
type SortDir = "asc" | "desc"

const SPRINT_ALL = "all"
const SPRINT_NONE = "none"

const PRIORITY_RANK: Record<Task["priority"], number> = {
  low: 0,
  medium: 1,
  high: 2,
}

export default function GeneralPage() {
  useBreadcrumb([{ label: "General" }])
  usePageAction({
    primary: { label: "Nueva tarea", href: "/boards/tasks/new" },
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get("view") === "lista" ? "lista" : "kanban"
  const sprintParam = searchParams.get("sprint")
  const { getToken } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>("created")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const headers = { Authorization: `Bearer ${token}` }
        const [tRes, bRes, cRes, sRes] = await Promise.all([
          fetch("/api/tasks", { headers }),
          fetch("/api/boards", { headers }),
          fetch("/api/columns", { headers }),
          fetch("/api/sprints", { headers }),
        ])
        if (!tRes.ok || !bRes.ok || !cRes.ok || !sRes.ok)
          throw new Error("Failed to load data")
        const [tData, bData, cData, sData] = await Promise.all([
          tRes.json(),
          bRes.json(),
          cRes.json(),
          sRes.json(),
        ])
        if (!cancelled) {
          setTasks(tData)
          setBoards(bData)
          setColumns(cData)
          setSprints(sData)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [getToken])

  const todayMondayIso = useMemo(
    () => toIsoDateString(mondayOfWeek(new Date())),
    []
  )

  const currentWeekSprintId = useMemo(
    () => sprints.find((s) => s.startDate === todayMondayIso)?.id ?? null,
    [sprints, todayMondayIso]
  )

  // Selection resolves from URL when present, else from the current-week
  // Sprint, else "all". Derived in render so URL stays the single source of
  // truth — picking a value just calls router.replace and rerenders.
  const selectedSprint = useMemo(() => {
    if (sprintParam === SPRINT_ALL || sprintParam === SPRINT_NONE)
      return sprintParam
    if (sprintParam && sprints.some((s) => s.id === sprintParam))
      return sprintParam
    return currentWeekSprintId ?? SPRINT_ALL
  }, [sprintParam, sprints, currentWeekSprintId])

  const handleSprintChange = (value: string | null) => {
    const next = value ?? SPRINT_ALL
    const params = new URLSearchParams(searchParams.toString())
    if (next === SPRINT_ALL) params.delete("sprint")
    else params.set("sprint", next)
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : "?", { scroll: false })
  }

  const boardNameById = useMemo(
    () => new Map(boards.map((b) => [b.id, b.name])),
    [boards]
  )

  const boardOptions = useMemo(
    () => boards.map((b) => ({ value: b.id, label: b.name })),
    [boards]
  )

  // base-ui Select.Value renders the raw value by default. The `items` prop on
  // <Select.Root> provides the value→label map that <Select.Value> uses.
  const sprintItems = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {
      [SPRINT_ALL]: "Todos los sprints",
      [SPRINT_NONE]: "Sin sprint",
    }
    for (const s of sprints) {
      const label = displaySprintName(s)
      m[s.id] = s.startDate === todayMondayIso ? `${label} · Esta semana` : label
    }
    return m
  }, [sprints, todayMondayIso])

  const filteredTasks = useMemo(() => {
    const byBoard =
      selectedBoardIds.length === 0
        ? tasks
        : tasks.filter((t) => selectedBoardIds.includes(t.boardId))
    const bySprint =
      selectedSprint === SPRINT_ALL
        ? byBoard
        : selectedSprint === SPRINT_NONE
          ? byBoard.filter((t) => t.sprintId === null)
          : byBoard.filter((t) => t.sprintId === selectedSprint)
    const dir = sortDir === "asc" ? 1 : -1
    return [...bySprint].sort((a, b) => {
      if (sortField === "priority") {
        return (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * dir
      }
      return a.id.localeCompare(b.id) * dir
    })
  }, [tasks, selectedBoardIds, selectedSprint, sortField, sortDir])

  const handleMove = async (taskId: string, newColumnId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const previousColumnId = task.columnId
    const boardId = task.boardId

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, columnId: newColumnId } : t))
    )

    try {
      const token = await getToken()
      const res = await fetch(`/api/boards/${boardId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ columnId: newColumnId }),
      })
      if (!res.ok) throw new Error("Failed to update")
      tasksStore.notify()
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, columnId: previousColumnId } : t))
      )
      toast.error("No se pudo mover la task")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-1/3 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl font-bold italic">General</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedSprint}
            onValueChange={handleSprintChange}
            items={sprintItems}
          >
            <SelectTrigger className="min-w-40">
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SPRINT_ALL}>Todos los sprints</SelectItem>
              <SelectItem value={SPRINT_NONE}>Sin sprint</SelectItem>
              {sprints.map((s) => {
                const label = displaySprintName(s)
                const isCurrent = s.startDate === todayMondayIso
                return (
                  <SelectItem key={s.id} value={s.id}>
                    {isCurrent ? `${label} · Esta semana` : label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <MultiSelect
            options={boardOptions}
            selected={selectedBoardIds}
            onChange={setSelectedBoardIds}
            placeholder="Filtrar por boards"
            searchPlaceholder="Buscar board..."
          />
          <Select
            value={sortField}
            onValueChange={(v) => setSortField(v as SortField)}
          >
            <SelectTrigger className="min-w-40">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Fecha de creación</SelectItem>
              <SelectItem value="priority">Prioridad</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            aria-label={
              sortDir === "asc"
                ? "Cambiar a descendente"
                : "Cambiar a ascendente"
            }
            onClick={() =>
              setSortDir((d) => (d === "asc" ? "desc" : "asc"))
            }
          >
            {sortDir === "asc" ? <ArrowUp /> : <ArrowDown />}
          </Button>
        </div>
      </div>
      {view === "lista" ? (
        <BoardList
          tasks={filteredTasks}
          columns={columns}
          boardNameById={boardNameById}
          onMove={handleMove}
        />
      ) : (
        <GeneralKanban
          tasks={filteredTasks}
          columns={columns}
          boardNameById={boardNameById}
          onMove={handleMove}
        />
      )}
    </div>
  )
}
