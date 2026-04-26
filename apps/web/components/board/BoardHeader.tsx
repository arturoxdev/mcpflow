"use client"

import { useUser } from "@clerk/nextjs"

import { cn } from "@/lib/utils"

interface Props {
  name: string
  done: number
  total: number
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

export function BoardHeader({ name, done, total }: Props) {
  const { user } = useUser()
  const firstName = user?.firstName ?? ""
  const filled = total === 0 ? 0 : Math.round((done / total) * 10)
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <div className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
          {getGreeting()}
          {firstName && `, ${firstName}`}
        </div>
        <h1 className="text-3xl font-medium tracking-tight">{name}</h1>
        <div className="text-muted-foreground mt-2 text-sm">
          <span className="text-accent">{done}</span> de {total} tareas
          completadas · respira y empieza por una.
        </div>
      </div>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 w-3.5 rounded-full transition-colors",
                i < filled ? "bg-accent" : "bg-muted"
              )}
            />
          ))}
        </div>
        <span className="font-mono">{pct}%</span>
      </div>
    </div>
  )
}
