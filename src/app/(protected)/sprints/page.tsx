"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import { sprintsStore } from "@/lib/sprints-store"
import { tasksStore } from "@/lib/tasks-store"
import { mondayOfWeek, toIsoDateString } from "@/lib/sprint-week"
import { NewSprintDialog } from "@/components/sprints/NewSprintDialog"
import { SprintCard } from "@/components/sprints/SprintCard"
import type { Column, Sprint, Task } from "@/server"

export default function SprintsPage() {
  useBreadcrumb([{ label: "Sprints" }])
  const { getToken } = useAuth()
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [sRes, tRes, cRes] = await Promise.all([
        fetch("/api/sprints", { headers }),
        fetch("/api/tasks", { headers }),
        fetch("/api/columns", { headers }),
      ])
      if (sRes.ok) setSprints(await sRes.json())
      if (tRes.ok) setTasks(await tRes.json())
      if (cRes.ok) setColumns(await cRes.json())
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchAll()
    const u1 = sprintsStore.subscribe(fetchAll)
    const u2 = tasksStore.subscribe(fetchAll)
    return () => {
      u1()
      u2()
    }
  }, [fetchAll])

  const todayMondayIso = useMemo(
    () => toIsoDateString(mondayOfWeek(new Date())),
    []
  )

  const closedColumnIds = useMemo(
    () => new Set(columns.filter((c) => c.isClosed).map((c) => c.id)),
    [columns]
  )

  const taskCountBySprint = useMemo(() => {
    const m = new Map<string, { total: number; closed: number }>()
    for (const t of tasks) {
      if (!t.sprintId) continue
      const entry = m.get(t.sprintId) ?? { total: 0, closed: 0 }
      entry.total += 1
      if (closedColumnIds.has(t.columnId)) entry.closed += 1
      m.set(t.sprintId, entry)
    }
    return m
  }, [tasks, closedColumnIds])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl font-bold italic">Sprints</h1>
        <Button onClick={() => setDialogOpen(true)}>Nuevo Sprint</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : sprints.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Aún no creaste ningún Sprint</EmptyTitle>
            <EmptyDescription>
              Empezá creando uno: elegí cualquier día de la semana y se anclará
              al lunes.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setDialogOpen(true)}>Crear primer Sprint</Button>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((s) => (
            <SprintCard
              key={s.id}
              sprint={s}
              isCurrent={s.startDate === todayMondayIso}
              taskCount={taskCountBySprint.get(s.id) ?? { total: 0, closed: 0 }}
            />
          ))}
        </div>
      )}

      <NewSprintDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingSprints={sprints}
      />
    </div>
  )
}
