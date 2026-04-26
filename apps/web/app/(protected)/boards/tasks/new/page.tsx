"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import type { Board } from "@repo/core"

import { Skeleton } from "@/components/ui/skeleton"
import { TaskForm } from "@/components/kanban/tasks/TaskForm"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import { usePageAction } from "@/hooks/use-page-action"
import { tasksStore } from "@/lib/tasks-store"

export default function NewTaskPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryBoardId = searchParams.get("boardId") ?? undefined
  const { getToken } = useAuth()

  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draftTitle, setDraftTitle] = useState("")
  const [draftBoardId, setDraftBoardId] = useState<string | undefined>(
    queryBoardId
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch("/api/boards", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data: Board[] = await res.json()
        if (!cancelled) setBoards(data)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [getToken])

  const validInitialBoardId = useMemo(() => {
    if (!queryBoardId) return undefined
    if (boards.length === 0) return queryBoardId
    return boards.some((b) => b.id === queryBoardId) ? queryBoardId : undefined
  }, [queryBoardId, boards])

  const currentBoardName = useMemo(() => {
    if (!draftBoardId) return null
    return boards.find((b) => b.id === draftBoardId)?.name ?? null
  }, [boards, draftBoardId])

  useBreadcrumb([
    { label: "Boards", href: "/boards" },
    ...(currentBoardName
      ? [
          {
            label: currentBoardName,
            href: `/boards/${draftBoardId}`,
          },
        ]
      : []),
    { label: draftTitle.trim() || "Sin título" },
  ])

  const cancelHref = queryBoardId ? `/boards/${queryBoardId}` : "/general"

  usePageAction({
    secondary: { label: "Cerrar", href: cancelHref },
    hideDefaults: true,
  })

  const handleSuccess = (savedBoardId: string) => {
    tasksStore.notify()
    router.push(`/boards/${savedBoardId}`)
  }
  const handleCancel = () => router.push(cancelHref)

  return (
    <div className="mx-auto w-full max-w-3xl py-10">
      {isLoading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      ) : (
        <TaskForm
          mode="create"
          initialBoardId={validInitialBoardId}
          boards={boards}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onTitleChange={setDraftTitle}
          onBoardChange={setDraftBoardId}
        />
      )}
    </div>
  )
}
