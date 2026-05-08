"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import {
  formatSprintDefaultName,
  formatSprintRange,
  mondayOfWeek,
  toIsoDateString,
} from "@/lib/sprint-week"
import { sprintsStore } from "@/lib/sprints-store"
import type { Sprint } from "@/server"

type State =
  | { phase: "loading" }
  | { phase: "redirect"; sprintId: string }
  | { phase: "empty"; weekStart: string }

export default function WeekPage() {
  useBreadcrumb([{ label: "Semana" }])
  const router = useRouter()
  const { getToken } = useAuth()
  const [state, setState] = useState<State>({ phase: "loading" })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const monday = mondayOfWeek(new Date())
      const weekStart = toIsoDateString(monday)
      const token = await getToken()
      const res = await fetch(
        `/api/sprints/today-summary?weekStart=${weekStart}&today=mon`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (cancelled) return
      if (!res.ok) {
        setState({ phase: "empty", weekStart })
        return
      }
      const summary = await res.json()
      if (summary.sprintId) {
        router.replace(`/sprints/${summary.sprintId}`)
        setState({ phase: "redirect", sprintId: summary.sprintId })
      } else {
        setState({ phase: "empty", weekStart })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [getToken, router])

  const handleCreate = async () => {
    if (state.phase !== "empty") return
    setIsCreating(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/sprints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ startDate: state.weekStart }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al crear")
      }
      const created: Sprint = await res.json()
      sprintsStore.notify()
      router.replace(`/sprints/${created.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear el Sprint")
    } finally {
      setIsCreating(false)
    }
  }

  if (state.phase === "loading" || state.phase === "redirect") {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const monday = new Date(state.weekStart + "T00:00:00")
  return (
    <div className="flex h-full items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{formatSprintDefaultName(monday)}</EmptyTitle>
          <EmptyDescription>
            {formatSprintRange(monday)} — aún no creaste un Sprint para esta
            semana.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={handleCreate} disabled={isCreating}>
          Crear Sprint de esta semana
        </Button>
      </Empty>
    </div>
  )
}
