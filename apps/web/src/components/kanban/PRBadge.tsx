import { Badge } from "@/components/ui/badge"

interface PRBadgeProps {
  pr: number
}

export function PRBadge({ pr }: PRBadgeProps) {
  const prNumber = String(pr).padStart(3, "0")

  return (
    <Badge variant="outline" className="font-mono">
      #PR-{prNumber}
    </Badge>
  )
}
