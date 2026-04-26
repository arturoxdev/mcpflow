import { z } from "zod"

export const TASK_TITLE_MAX = 120

export const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, "El título es obligatorio")
    .max(TASK_TITLE_MAX, `El título no puede exceder ${TASK_TITLE_MAX} caracteres`),
  priority: z.enum(["low", "medium", "high"], {
    message: "Selecciona una prioridad",
  }),
  description: z.string(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

export const PRIORITY_OPTIONS: { value: TaskFormValues["priority"]; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
]
