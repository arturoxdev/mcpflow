import type { LucideIcon } from "lucide-react"
import { Snail, Zap } from "lucide-react"

import type { Effort } from "@/server"
import { cn } from "@/lib/utils"

const ICON: Record<Effort, LucideIcon> = {
  low: Zap,
  high: Snail,
}

const COLOR: Record<Effort, string> = {
  low: "text-effort-low",
  high: "text-effort-high",
}

const LABEL: Record<Effort, string> = {
  low: "Esfuerzo bajo",
  high: "Esfuerzo alto",
}

interface Props {
  effort: Effort | null
  className?: string
}

export function EffortGlyph({ effort, className }: Props) {
  if (!effort) return null
  const Icon = ICON[effort]
  return (
    <span
      className={cn("inline-flex items-center", className)}
      aria-label={LABEL[effort]}
      title={LABEL[effort]}
    >
      <Icon className={cn("size-3.5", COLOR[effort])} aria-hidden="true" />
    </span>
  )
}
