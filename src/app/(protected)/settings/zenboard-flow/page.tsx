"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import type { Column, Task } from "@/server"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import { ColumnFormDialog } from "@/components/settings/column-form-dialog"
import { ZenBoardFlowList } from "@/components/settings/zenboard-flow-list"

export default function ZenBoardFlowPage() {
  useBreadcrumb([
    { label: "Settings" },
    { label: "ZenBoard Flow" },
  ])
  const { getToken } = useAuth()

  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Column | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Column | null>(null)
  const [deleting, setDeleting] = useState(false)

  const authedHeaders = useCallback(async () => {
    const token = await getToken()
    return { Authorization: `Bearer ${token}` }
  }, [getToken])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const headers = await authedHeaders()
      const [cRes, tRes] = await Promise.all([
        fetch(`/api/columns`, { headers }),
        fetch(`/api/tasks`, { headers }),
      ])
      if (!cRes.ok) throw new Error("Failed to load columns")
      if (!tRes.ok) throw new Error("Failed to load tasks")
      const [cData, tData] = await Promise.all([cRes.json(), tRes.json()])
      setColumns(cData)
      setTasks(tData)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [authedHeaders])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const headers = await authedHeaders()
      const res = await fetch(`/api/columns/${deleteTarget.id}`, {
        method: "DELETE",
        headers,
      })
      if (res.status === 409) {
        toast.error("Mueve las tasks de la columna antes de borrarla")
        setDeleteTarget(null)
        return
      }
      if (!res.ok) throw new Error("Failed to delete")
      toast.success(`Columna "${deleteTarget.name}" eliminada`)
      setDeleteTarget(null)
      loadData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl font-bold italic">
            ZenBoard Flow
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Configura las columnas que conforman tu flujo. Aplican a{" "}
            <span className="text-foreground">todos tus boards</span>.
            Arrastra para reordenar; agrega o elimina las que necesites.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Agregar columna
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <ZenBoardFlowList
            columns={columns}
            tasks={tasks}
            onColumnsChange={setColumns}
            onEdit={(c) => setEditTarget(c)}
            onDelete={(c) => setDeleteTarget(c)}
          />
        )}
      </section>

      <ColumnFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadData}
      />

      {editTarget && (
        <ColumnFormDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          column={editTarget}
          onSuccess={loadData}
        />
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar columna?</DialogTitle>
            <DialogDescription>
              {deleteTarget &&
                `Vas a eliminar "${deleteTarget.name}" del flujo. Si tiene tasks, primero deberás moverlas.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
