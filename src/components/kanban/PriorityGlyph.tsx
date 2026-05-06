import type { Priority } from "@/server"

import { cn } from "@/lib/utils"

const COUNT: Record<Priority, number> = {
  low: 1,
  medium: 2,
  high: 3,
}

const COLOR: Record<Priority, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-med",
  high: "bg-priority-high",
}

const LABEL: Record<Priority, string> = {
  low: "Prioridad baja",
  medium: "Prioridad media",
  high: "Prioridad alta",
}

interface Props {
  priority: Priority
  className?: string
}

export function PriorityGlyph({ priority, className }: Props) {
  const count = COUNT[priority]
  const color = COLOR[priority]
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={LABEL[priority]}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={cn("size-1.5 rounded-full", color)} />
      ))}
    </span>
  )
}
