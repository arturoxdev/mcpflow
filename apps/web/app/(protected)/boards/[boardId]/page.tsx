"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Board } from "@repo/core"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BoardHeader } from "@/components/board/BoardHeader"
import { BoardList } from "@/components/board/BoardList"
import { KanbanBoard } from "@/components/kanban"
import { useKanban } from "@/components/kanban/hooks/useKanban"
import { COLUMNS } from "@/components/kanban/constants"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import { usePageAction } from "@/hooks/use-page-action"

interface BoardPageProps {
  params: Promise<{ boardId: string }>
}

export default function BoardPage({ params }: BoardPageProps) {
  const { boardId } = use(params)
  const searchParams = useSearchParams()
  const view = searchParams.get("view") === "lista" ? "lista" : "kanban"

  const [board, setBoard] = useState<Board | null>(null)
  const [isBoardLoading, setIsBoardLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    tasks,
    isLoading: areTasksLoading,
    error: tasksError,
    moveTask,
    getTasksByStatus,
  } = useKanban({ boardId })

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await fetch(`/api/boards/${boardId}`)
        if (!response.ok) throw new Error("Board not found")
        const data = await response.json()
        setBoard(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load board")
      } finally {
        setIsBoardLoading(false)
      }
    }

    fetchBoard()
  }, [boardId])

  useBreadcrumb(
    board
      ? [{ label: "Boards", href: "/boards" }, { label: board.name }]
      : [{ label: "Boards", href: "/boards" }]
  )

  usePageAction({
    primary: {
      label: "Nueva tarea",
      href: `/boards/tasks/new?boardId=${boardId}`,
    },
  })

  if (isBoardLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-6">
          <Skeleton className="h-64 w-1/3 rounded-xl" />
          <Skeleton className="h-64 w-1/3 rounded-xl" />
          <Skeleton className="h-64 w-1/3 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertTitle>Board no encontrado</AlertTitle>
          <AlertDescription>{error || "Board not found"}</AlertDescription>
        </Alert>
        <Button
          render={<Link href="/boards" />}
          nativeButton={false}
          variant="outline"
          className="self-start"
        >
          Back to boards
        </Button>
      </div>
    )
  }

  const doneCount = tasks.filter((t) => t.status === "done").length

  return (
    <div className="flex h-full flex-col gap-8">
      <BoardHeader name={board.name} done={doneCount} total={tasks.length} />

      {areTasksLoading ? (
        <div className="flex gap-6">
          {COLUMNS.map((c) => (
            <Skeleton key={c.id} className="h-64 w-1/3 rounded-xl" />
          ))}
        </div>
      ) : tasksError ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar las tareas</AlertTitle>
          <AlertDescription>{tasksError}</AlertDescription>
        </Alert>
      ) : view === "lista" ? (
        <BoardList tasks={tasks} boardId={boardId} onMove={moveTask} />
      ) : (
        <KanbanBoard
          tasks={tasks}
          boardId={boardId}
          onMove={moveTask}
          getTasksByStatus={getTasksByStatus}
        />
      )}
    </div>
  )
}
