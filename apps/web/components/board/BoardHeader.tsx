"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface Props {
  name: string
  done: number
  total: number
  onRename?: (newName: string) => Promise<void>
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

export function BoardHeader({ name, done, total, onRename }: Props) {
  const { user } = useUser()
  const firstName = user?.firstName ?? ""
  const filled = total === 0 ? 0 : Math.round((done / total) * 10)
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(name)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) setValue(name)
  }, [open, name])

  const trimmed = value.trim()
  const canSave = !!trimmed && trimmed !== name && !isSaving

  const handleSave = async () => {
    if (!onRename || !canSave) return
    setIsSaving(true)
    try {
      await onRename(trimmed)
      setOpen(false)
    } catch {
      toast.error("No se pudo renombrar")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <div className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
          {getGreeting()}
          {firstName && `, ${firstName}`}
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-medium tracking-tight">{name}</h1>
          {onRename && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Renombrar board"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil />
                  </Button>
                }
              />
              <PopoverContent align="start" className="w-80 gap-3">
                <div className="text-muted-foreground text-[11px] uppercase tracking-[0.16em]">
                  Renombrar board
                </div>
                <Input
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      void handleSave()
                    }
                  }}
                  placeholder="Nombre del board"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={!canSave}
                  >
                    {isSaving && <Spinner data-icon="inline-start" />}
                    Guardar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
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
