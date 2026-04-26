"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import type { Board, Task } from "@repo/core"

import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { taskFormSchema, type TaskFormValues } from "@/lib/schemas/task"
import { MarkdownEditor } from "./MarkdownEditor"
import { PriorityPicker } from "./PriorityPicker"

type TaskFormMode = "create" | "edit"

interface TaskFormProps {
  mode: TaskFormMode
  initialBoardId?: string
  boards: Board[]
  task?: Task
  onSuccess: (boardId: string) => void
  onCancel: () => void
  onTitleChange?: (title: string) => void
  onBoardChange?: (boardId: string) => void
  onDelete?: () => Promise<void> | void
}

export function TaskForm({
  mode,
  initialBoardId,
  boards,
  task,
  onSuccess,
  onCancel,
  onTitleChange,
  onBoardChange,
  onDelete,
}: TaskFormProps) {
  const isEdit = mode === "edit"
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedBoardId, setSelectedBoardId] = useState<string | undefined>(
    initialBoardId ?? task?.boardId
  )
  const [descriptionMode, setDescriptionMode] = useState<"edit" | "view">(
    "edit"
  )

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task
      ? {
          title: task.title,
          priority: task.priority,
          description: task.description ?? "",
        }
      : { title: "", priority: undefined, description: "" },
  })

  const isDirty = form.formState.isDirty

  const onSubmit = async (values: TaskFormValues) => {
    if (!selectedBoardId) {
      toast.error("Seleccioná un board para guardar la tarea")
      return
    }
    setIsSubmitting(true)
    try {
      let response: Response
      if (isEdit && task) {
        response = await fetch(
          `/api/boards/${task.boardId}/tasks/${task.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: values.title.trim(),
              description: values.description.trim(),
              priority: values.priority,
              status: task.status,
            }),
          }
        )
      } else {
        response = await fetch(`/api/boards/${selectedBoardId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: values.title.trim(),
            description: values.description.trim(),
            priority: values.priority,
            status: "todo",
          }),
        })
      }

      if (!response.ok) throw new Error("Failed to save task")
      toast.success(isEdit ? "Cambios guardados" : "Tarea creada")
      form.reset(values)
      onSuccess(selectedBoardId)
    } catch (error) {
      console.error("Error saving task:", error)
      toast.error(
        isEdit
          ? "Error al guardar los cambios. Intenta de nuevo."
          : "Error al crear la tarea. Intenta de nuevo."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete()
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const idDisplay =
    isEdit && task
      ? `#PR-${String(task.pr).padStart(3, "0")}`
      : "#PR-—"
  const idHelper = isEdit ? "auto · solo lectura" : "se generará al guardar"

  const footerStatus = isEdit
    ? isSubmitting
      ? "guardando…"
      : isDirty
        ? "sin guardar"
        : "guardado"
    : "sin guardar"

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <span className="bg-muted/50 border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-wide">
          <span className="opacity-60">id</span>
          <span className="text-foreground">{idDisplay}</span>
        </span>
        <span className="text-muted-foreground/70 font-mono text-[10px]">
          {idHelper}
        </span>

        <span className="bg-border mx-1 h-3.5 w-px" />

        <span className="text-muted-foreground/70 font-mono text-[10px]">
          proyecto
        </span>
        <Select
          items={boards.map((b) => ({ value: b.id, label: b.name }))}
          value={selectedBoardId ?? null}
          onValueChange={(v) => {
            if (!v || isEdit) return
            setSelectedBoardId(v)
            onBoardChange?.(v)
          }}
          disabled={isEdit}
        >
          <SelectTrigger size="sm" className="w-auto min-w-40">
            <SelectValue placeholder="Seleccionar board" />
          </SelectTrigger>
          <SelectContent>
            {boards.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <div className="mb-6">
            <input
              type="text"
              autoFocus
              placeholder="Título de la tarea"
              className={cn(
                "text-foreground placeholder:text-muted-foreground/50 w-full border-none bg-transparent p-0 text-3xl font-medium leading-tight tracking-tight outline-none",
                fieldState.error && "text-destructive"
              )}
              {...field}
              onChange={(e) => {
                field.onChange(e)
                onTitleChange?.(e.target.value)
              }}
            />
            {fieldState.error && (
              <p className="text-destructive mt-1 text-xs">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <Controller
        control={form.control}
        name="priority"
        render={({ field, fieldState }) => (
          <div className="mb-9 flex flex-wrap items-center gap-4">
            <span className="text-muted-foreground/70 min-w-[90px] text-[11px] uppercase tracking-[0.16em]">
              Prioridad
            </span>
            <PriorityPicker
              value={field.value}
              onChange={field.onChange}
              invalid={!!fieldState.error}
            />
            {fieldState.error && (
              <p className="text-destructive text-xs">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <Controller
        control={form.control}
        name="description"
        render={({ field }) => (
          <div className="flex flex-col">
            <div className="text-muted-foreground/70 mb-3.5 flex flex-wrap items-center gap-2.5 text-[11px] uppercase tracking-[0.16em]">
              <span>Descripción</span>
              <span className="text-accent bg-accent/10 rounded font-mono text-[9.5px] tracking-wide px-1.5 py-0.5 normal-case">
                md
              </span>
              <div className="border-border ml-auto flex gap-1 rounded-md border p-0.5">
                {(["edit", "view"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDescriptionMode(m)}
                    className={cn(
                      "rounded px-2.5 py-0.5 text-[10px] uppercase tracking-wider transition-colors",
                      descriptionMode === m
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "edit" ? "Editar" : "Vista"}
                  </button>
                ))}
              </div>
            </div>
            <MarkdownEditor
              value={field.value ?? ""}
              onChange={field.onChange}
              mode={descriptionMode}
              placeholder={
                "Escribe en markdown…\n\n## Encabezado\n- viñeta\n**negrita** *cursiva* `código`"
              }
            />
            <p className="text-muted-foreground/60 mt-2.5 font-mono text-[11px]">
              **negrita** *cursiva* `código` # encabezado - lista &gt; cita
            </p>
          </div>
        )}
      />

      <div className="border-border mt-10 flex flex-wrap items-center gap-3 border-t pt-5">
        {onDelete && (
          <Dialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Eliminar tarea"
                  disabled={isSubmitting || isDeleting}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar tarea</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que quieres eliminar &quot;
                  {task?.title ?? "esta tarea"}&quot;? Esta acción no se puede
                  deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting && <Spinner data-icon="inline-start" />}
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <span className="text-muted-foreground/70 font-mono text-[11px]">
          {footerStatus}
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting || !selectedBoardId || (isEdit && !isDirty)
            }
          >
            {isSubmitting && <Spinner data-icon="inline-start" />}
            {isSubmitting
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : "Guardar tarea"}
          </Button>
        </div>
      </div>
    </form>
  )
}
