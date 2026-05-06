"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Board } from "@/server"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArchiveBoardDialog } from "@/components/board/ArchiveBoardDialog"
import { BoardHeader } from "@/components/board/BoardHeader"
import { BoardList } from "@/components/board/BoardList"
import { SharePublicInboxPopover } from "@/components/board/SharePublicInboxPopover"
import { KanbanBoard } from "@/components/kanban"
import { useKanban } from "@/components/kanban/hooks/useKanban"
import { Skeleton } from "@/components/ui/skeleton"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import { usePageAction } from "@/hooks/use-page-action"
import { boardsStore } from "@/lib/boards-store"

interface BoardPageClientProps {
  boardId: string
  initialBoard: Board
}

export function BoardPageClient({ boardId, initialBoard }: BoardPageClientProps) {
  const searchParams = useSearchParams()
  const view = searchParams.get("view") === "lista" ? "lista" : "kanban"

  const [board, setBoard] = useState<Board | null>(initialBoard)

  const {
    tasks,
    columns,
    isLoading: areTasksLoading,
    error: tasksError,
    moveTask,
    getTasksByColumn,
  } = useKanban({ boardId })

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

  if (!board) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertTitle>Board no encontrado</AlertTitle>
          <AlertDescription>Board not found</AlertDescription>
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

  const lastColumnId = columns.length > 0 ? columns[columns.length - 1]!.id : null
  const doneCount = lastColumnId
    ? tasks.filter((t) => t.columnId === lastColumnId).length
    : 0

  const handleRename = async (newName: string) => {
    const res = await fetch(`/api/boards/${boardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    })
    if (!res.ok) throw new Error("Failed to rename")
    const updated = (await res.json()) as Board
    setBoard(updated)
    boardsStore.notify()
    toast.success("Nombre actualizado")
  }

  return (
    <div className="flex h-full flex-col gap-8">
      <BoardHeader
        name={board.name}
        done={doneCount}
        total={tasks.length}
        onRename={handleRename}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <SharePublicInboxPopover
              boardId={boardId}
              initialEnabled={board.publicInboxEnabled}
              onChange={(next) =>
                setBoard((current) =>
                  current ? { ...current, publicInboxEnabled: next } : current
                )
              }
            />
            <ArchiveBoardDialog
              boardId={boardId}
              boardName={board.name}
              taskCount={tasks.length}
              disabled={areTasksLoading}
            />
          </div>
        }
      />

      {areTasksLoading ? (
        <div className="flex gap-6">
          {(columns.length > 0 ? columns : [{ id: "a" }, { id: "b" }, { id: "c" }]).map((c) => (
            <Skeleton key={c.id} className="h-64 w-1/3 rounded-xl" />
          ))}
        </div>
      ) : tasksError ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar las tareas</AlertTitle>
          <AlertDescription>{tasksError}</AlertDescription>
        </Alert>
      ) : view === "lista" ? (
        <BoardList
          tasks={tasks}
          columns={columns}
          boardId={boardId}
          onMove={moveTask}
        />
      ) : (
        <KanbanBoard
          tasks={tasks}
          columns={columns}
          boardId={boardId}
          onMove={moveTask}
          getTasksByColumn={getTasksByColumn}
        />
      )}
    </div>
  )
}
