"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import {
  displaySprintName,
  formatSprintRange,
  fromIsoDateString,
} from "@/lib/sprint-week"
import { sprintsStore } from "@/lib/sprints-store"
import { tasksStore } from "@/lib/tasks-store"
import type { Sprint } from "@/server"

interface SprintCardProps {
  sprint: Sprint
  isCurrent: boolean
  taskCount: { total: number; closed: number }
}

export function SprintCard({ sprint, isCurrent, taskCount }: SprintCardProps) {
  const { getToken } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/sprints/${sprint.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      sprintsStore.notify()
      tasksStore.notify()
      toast.success("Sprint eliminado")
    } catch {
      toast.error("Error al eliminar el Sprint")
    } finally {
      setConfirmDelete(false)
    }
  }

  const startDate = fromIsoDateString(sprint.startDate)

  return (
    <Card className="hover:border-ring focus-within:border-ring relative transition-colors">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>
            <Link
              href={`/sprints/${sprint.id}`}
              className="hover:text-primary rounded-sm outline-none transition-colors before:absolute before:inset-0 before:content-[''] focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {displaySprintName(sprint)}
            </Link>
          </CardTitle>
          {isCurrent && (
            <Badge variant="secondary" className="uppercase">
              Actual
            </Badge>
          )}
        </div>
        <CardDescription>
          {formatSprintRange(startDate)}
          <span className="text-muted-foreground/70 ml-2 font-mono">
            · {taskCount.closed}/{taskCount.total} hechas
          </span>
        </CardDescription>
        <CardAction className="relative z-10">
          <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Eliminar Sprint"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 />
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar Sprint</DialogTitle>
                <DialogDescription>
                  Esto sacará {taskCount.total} Task(s) del plan. Las Tasks
                  vuelven al pool y no se borran.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
