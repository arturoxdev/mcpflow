"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { Column } from "@repo/core"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export const COLUMN_COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: "bg-destructive", label: "Rojo" },
  { value: "bg-chart-3", label: "Naranja" },
  { value: "bg-chart-4", label: "Verde" },
  { value: "bg-chart-2", label: "Azul" },
  { value: "bg-primary", label: "Primario" },
  { value: "bg-muted-foreground", label: "Gris" },
]

const formSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(50, "Máximo 50 caracteres"),
  color: z.string().min(1, "Selecciona un color"),
})

type FormValues = z.infer<typeof formSchema>

interface ColumnFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  column?: Column
  onSuccess: () => void
}

export function ColumnFormDialog({
  open,
  onOpenChange,
  column,
  onSuccess,
}: ColumnFormDialogProps) {
  const isEdit = !!column
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: column?.name ?? "",
      color: column?.color ?? "bg-muted-foreground",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: column?.name ?? "",
        color: column?.color ?? "bg-muted-foreground",
      })
    }
  }, [open, column, form])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const url = isEdit
        ? `/api/columns/${column!.id}`
        : `/api/columns`
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save column")
      }
      toast.success(isEdit ? "Columna actualizada" : "Columna creada")
      onOpenChange(false)
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedColor = form.watch("color")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar columna" : "Nueva columna"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="column-name">Nombre</FieldLabel>
              <Input
                id="column-name"
                autoFocus
                placeholder="Ej. In Review"
                maxLength={50}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.name.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel>Color</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {COLUMN_COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      form.setValue("color", option.value, { shouldDirty: true })
                    }
                    aria-label={option.label}
                    aria-pressed={selectedColor === option.value}
                    className={cn(
                      "border-border focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-md border outline-none transition-colors focus-visible:ring-2",
                      selectedColor === option.value && "border-foreground ring-2 ring-foreground/20"
                    )}
                  >
                    <span className={cn("size-4 rounded-full", option.value)} />
                  </button>
                ))}
              </div>
              <FieldDescription>
                Color del indicador en el kanban.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {isEdit ? "Guardar cambios" : "Crear columna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
