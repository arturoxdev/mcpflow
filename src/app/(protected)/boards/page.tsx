"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Board } from "@/server"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import { boardsStore } from "@/lib/boards-store"

export default function BoardsPage() {
  useBreadcrumb([{ label: "Boards" }])
  const { getToken } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newBoardName, setNewBoardName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null)

  useEffect(() => {
    fetchBoards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchBoards = async () => {
    try {
      const token = await getToken()
      const response = await fetch("/api/boards", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setBoards(data)
    } catch (error) {
      console.error("Failed to fetch boards:", error)
      toast.error("Error al cargar los boards")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardName.trim()) return

    setIsCreating(true)
    try {
      const token = await getToken()
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newBoardName.trim() }),
      })
      const newBoard = await response.json()
      setBoards((prev) => [...prev, newBoard])
      setNewBoardName("")
      boardsStore.notify()
      toast.success("Board creado")
    } catch (error) {
      console.error("Failed to create board:", error)
      toast.error("Error al crear el board")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return
    try {
      await fetch(`/api/boards/${boardToDelete.id}`, { method: "DELETE" })
      setBoards((prev) => prev.filter((b) => b.id !== boardToDelete.id))
      boardsStore.notify()
      toast.success("Board eliminado")
    } catch (error) {
      console.error("Failed to delete board:", error)
      toast.error("Error al eliminar el board")
    } finally {
      setBoardToDelete(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl font-bold italic">Your Boards</h1>
      </div>

      <form onSubmit={handleCreateBoard}>
        <FieldGroup>
          <Field orientation="horizontal">
            <Input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="New board name..."
              className="max-w-sm"
            />
            <Button type="submit" disabled={isCreating || !newBoardName.trim()}>
              {isCreating && <Spinner data-icon="inline-start" />}
              {isCreating ? "Creating..." : "Create Board"}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No boards yet</EmptyTitle>
            <EmptyDescription>
              Create your first board to get started
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="hover:border-ring relative transition-colors focus-within:border-ring"
            >
              <CardHeader>
                <CardTitle>
                  <Link
                    href={`/boards/${board.id}`}
                    className="rounded-sm outline-none hover:text-primary transition-colors before:absolute before:inset-0 before:content-[''] focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {board.name}
                  </Link>
                </CardTitle>
                {board.description && (
                  <CardDescription>{board.description}</CardDescription>
                )}
                <CardAction className="relative z-10">
                  <Dialog
                    open={boardToDelete?.id === board.id}
                    onOpenChange={(open) => !open && setBoardToDelete(null)}
                  >
                    <DialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete board"
                          onClick={() => setBoardToDelete(board)}
                        >
                          <Trash2 />
                        </Button>
                      }
                    />
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Eliminar board</DialogTitle>
                        <DialogDescription>
                          ¿Estás seguro de que quieres eliminar &quot;
                          {boardToDelete?.name}&quot;? Esta acción no se puede
                          deshacer.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={() => setBoardToDelete(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteBoard}
                        >
                          Eliminar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
