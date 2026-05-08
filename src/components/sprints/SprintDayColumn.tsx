"use client"

import { useDroppable } from "@dnd-kit/core"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { dayLabel } from "@/lib/sprint-week"
import { cn } from "@/lib/utils"
import type { SprintDay } from "@/server"

interface SprintDayColumnProps {
  day: SprintDay
  date: Date
  isToday: boolean
  children: React.ReactNode
  count: number
}

export function SprintDayColumn({
  day,
  date,
  isToday,
  children,
  count,
}: SprintDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day}` })
  const dayNum = format(date, "d", { locale: es })

  return (
    <div className="flex min-w-[220px] flex-1 flex-col gap-2">
      <div
        className={cn(
          "flex items-baseline justify-between rounded-md px-2 py-1.5",
          isToday && "bg-accent/30"
        )}
      >
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-sm tracking-wide",
              isToday ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {dayLabel(day)}
          </span>
          <span className="text-muted-foreground/70 font-mono text-[11px]">
            {dayNum}
          </span>
        </div>
        <span className="text-muted-foreground font-mono text-xs">
          {String(count).padStart(2, "0")}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[180px] flex-1 flex-col gap-2 rounded-lg p-1.5 transition-colors",
          isOver && "bg-accent/20 ring-1 ring-accent"
        )}
      >
        {children}
      </div>
    </div>
  )
}
