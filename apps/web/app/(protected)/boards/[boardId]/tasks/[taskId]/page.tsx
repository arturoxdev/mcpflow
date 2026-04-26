"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import type { Board, Task } from "@repo/core"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskForm } from "@/components/kanban/tasks/TaskForm"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import { usePageAction } from "@/hooks/use-page-action"
import { tasksStore } from "@/lib/tasks-store"

interface PageProps {
  params: Promise<{ boardId: string; taskId: string }>
}

export default function TaskDetailPage({ params }: PageProps) {
  const { boardId, taskId } = use(params)
  const router = useRouter()
  const { getToken } = useAuth()

  const [task, setTask] = useState<Task | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const headers = { Authorization: `Bearer ${token}` }
        const [tRes, bRes] = await Promise.all([
          fetch(`/api/boards/${boardId}/tasks/${taskId}`, { headers }),
          fetch("/api/boards", { headers }),
        ])
        if (!tRes.ok) {
          if (tRes.status === 404) {
            if (!cancelled) setError("Tarea no encontrada")
          } else {
            throw new Error("Failed to fetch task")
          }
          return
        }
        if (!bRes.ok) throw new Error("Failed to fetch boards")
        const [tData, bData] = await Promise.all([tRes.json(), bRes.json()])
        if (!cancelled) {
          setTask(tData)
          setBoards(bData)
          setDraftTitle(tData.title ?? "")
        }
      } catch (err) {
        console.error("Error loading task detail:", err)
        if (!cancelled) setError("Error al cargar la tarea")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [boardId, taskId, getToken])

  const boardName = useMemo(() => {
    return boards.find((b) => b.id === boardId)?.name ?? "Board"
  }, [boards, boardId])

  useBreadcrumb([
    { label: "Boards", href: "/boards" },
    { label: boardName, href: `/boards/${boardId}` },
    { label: draftTitle.trim() || task?.title || "Tarea" },
  ])

  usePageAction({
    secondary: { label: "Cerrar", href: `/boards/${boardId}` },
    hideDefaults: true,
  })

  const handleSuccess = (savedBoardId: string) => {
    tasksStore.notify()
    router.push(`/boards/${savedBoardId}`)
  }

  const handleCancel = () => router.push(`/boards/${boardId}`)

  const handleDelete = async () => {
    try {
      const token = await getToken()
      const response = await fetch(
        `/api/boards/${boardId}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!response.ok) throw new Error("Failed to delete task")
      tasksStore.notify()
      toast.success("Tarea eliminada")
      router.push(`/boards/${boardId}`)
    } catch (err) {
      console.error("Error deleting task:", err)
      toast.error("Error al eliminar la tarea")
      throw err
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-10">
      {isLoading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      ) : error || !task ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Tarea no encontrada"}</AlertDescription>
        </Alert>
      ) : (
        <TaskForm
          mode="edit"
          initialBoardId={boardId}
          boards={boards}
          task={task}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onTitleChange={setDraftTitle}
        />
      )}
    </div>
  )
}
