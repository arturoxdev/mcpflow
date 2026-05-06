import { Priority } from "@/server"
import { Badge } from "@/components/ui/badge"

interface PriorityBadgeProps {
  priority: Priority
}

const VARIANT: Record<Priority, React.ComponentProps<typeof Badge>["variant"]> = {
  high: "destructive",
  medium: "outline",
  low: "secondary",
}

const LABEL: Record<Priority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return <Badge variant={VARIANT[priority]}>{LABEL[priority]}</Badge>
}
