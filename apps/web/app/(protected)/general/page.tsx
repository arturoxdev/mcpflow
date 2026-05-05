"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import type { Board, Column, Task } from "@repo/core"
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
import { tasksStore } from "@/lib/tasks-store"

type SortField = "priority" | "created"
type SortDir = "asc" | "desc"

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
  const searchParams = useSearchParams()
  const view = searchParams.get("view") === "lista" ? "lista" : "kanban"
  const { getToken } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [columns, setColumns] = useState<Column[]>([])
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
        const [tRes, bRes, cRes] = await Promise.all([
          fetch("/api/tasks", { headers }),
          fetch("/api/boards", { headers }),
          fetch("/api/columns", { headers }),
        ])
        if (!tRes.ok || !bRes.ok || !cRes.ok)
          throw new Error("Failed to load data")
        const [tData, bData, cData] = await Promise.all([
          tRes.json(),
          bRes.json(),
          cRes.json(),
        ])
        if (!cancelled) {
          setTasks(tData)
          setBoards(bData)
          setColumns(cData)
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

  const boardNameById = useMemo(
    () => new Map(boards.map((b) => [b.id, b.name])),
    [boards]
  )

  const boardOptions = useMemo(
    () => boards.map((b) => ({ value: b.id, label: b.name })),
    [boards]
  )

  const filteredTasks = useMemo(() => {
    const filtered =
      selectedBoardIds.length === 0
        ? tasks
        : tasks.filter((t) => selectedBoardIds.includes(t.boardId))
    const dir = sortDir === "asc" ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortField === "priority") {
        return (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * dir
      }
      return a.id.localeCompare(b.id) * dir
    })
  }, [tasks, selectedBoardIds, sortField, sortDir])

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
