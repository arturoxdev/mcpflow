"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Archive } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { boardsStore } from "@/lib/boards-store"

interface ArchiveBoardDialogProps {
  boardId: string
  boardName: string
  taskCount: number
  disabled?: boolean
}

export function ArchiveBoardDialog({
  boardId,
  boardName,
  taskCount,
  disabled = false,
}: ArchiveBoardDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  const handleArchive = async () => {
    setIsArchiving(true)
    try {
      const response = await fetch(`/api/boards/${boardId}/archive`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to archive board")
      }

      boardsStore.notify()
      setOpen(false)
      toast.success("Board archivado")
      router.push("/general")
    } catch {
      toast.error("No se pudo archivar el board")
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" disabled={disabled}>
            <Archive data-icon="inline-start" />
            Archivar
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archivar este board</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a archivar <strong>{boardName}</strong>. {taskCount}{" "}
            {taskCount === 1 ? "tarea" : "tareas"} desaparecerán de la lista de
            boards, de /general y del Public Inbox. Esta acción no se puede
            revertir desde la app.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            render={<Button type="button" variant="outline" />}
            disabled={isArchiving}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            render={<Button type="button" variant="destructive" />}
            onClick={(event) => {
              event.preventDefault()
              void handleArchive()
            }}
            disabled={isArchiving}
          >
            {isArchiving && <Spinner data-icon="inline-start" />}
            Archivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
