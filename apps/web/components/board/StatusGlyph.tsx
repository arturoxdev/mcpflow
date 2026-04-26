import { Circle, CircleDashed, CheckCircle2 } from "lucide-react"
import type { Status } from "@repo/core"

import { cn } from "@/lib/utils"

interface Props {
  status: Status
  className?: string
}

const LABEL: Record<Status, string> = {
  todo: "Por hacer",
  doing: "En curso",
  done: "Hecha",
}

export function StatusGlyph({ status, className }: Props) {
  const label = LABEL[status]
  if (status === "done") {
    return (
      <CheckCircle2
        aria-label={label}
        className={cn("text-accent size-4", className)}
      />
    )
  }
  if (status === "doing") {
    return (
      <CircleDashed
        aria-label={label}
        className={cn("text-primary size-4", className)}
      />
    )
  }
  return (
    <Circle
      aria-label={label}
      className={cn("text-muted-foreground/60 size-4", className)}
    />
  )
}
