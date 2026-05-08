"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { sprintsStore } from "@/lib/sprints-store"
import {
  formatSprintDefaultName,
  formatSprintRange,
  mondayOfWeek,
  toIsoDateString,
} from "@/lib/sprint-week"
import type { Sprint } from "@/server"

import "react-day-picker/style.css"

interface NewSprintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingSprints: Sprint[]
  onCreated?: (sprint: Sprint) => void
}

export function NewSprintDialog({
  open,
  onOpenChange,
  existingSprints,
  onCreated,
}: NewSprintDialogProps) {
  const { getToken } = useAuth()
  const [selected, setSelected] = useState<Date | undefined>(() =>
    mondayOfWeek(new Date())
  )
  const [isCreating, setIsCreating] = useState(false)

  const occupiedStartDates = useMemo(
    () => new Set(existingSprints.map((s) => s.startDate)),
    [existingSprints]
  )

  // Disable Mondays whose week is already occupied. The picker snaps any click
  // to that week's Monday, so disabling a single day on each occupied week is
  // enough to block it.
  const disabledMatcher = (date: Date) => {
    const monday = mondayOfWeek(date)
    return occupiedStartDates.has(toIsoDateString(monday))
  }

  const selectedMonday = selected ? mondayOfWeek(selected) : undefined
  const isOccupied = selectedMonday
    ? occupiedStartDates.has(toIsoDateString(selectedMonday))
    : false

  const handleCreate = async () => {
    if (!selectedMonday || isOccupied) return
    setIsCreating(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ startDate: toIsoDateString(selectedMonday) }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al crear el Sprint")
      }
      const created: Sprint = await res.json()
      sprintsStore.notify()
      toast.success("Sprint creado")
      onOpenChange(false)
      onCreated?.(created)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear el Sprint")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Sprint</DialogTitle>
          <DialogDescription>
            Elegí cualquier día de la semana — se anclará al lunes.
          </DialogDescription>
        </DialogHeader>

        <div className="rdp-zb flex justify-center py-2">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => setSelected(d ? mondayOfWeek(d) : undefined)}
            ISOWeek
            weekStartsOn={1}
            showWeekNumber
            locale={es}
            disabled={disabledMatcher}
            modifiersClassNames={{
              selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              today: "font-semibold ring-1 ring-border",
            }}
            classNames={{
              week_number:
                "text-muted-foreground font-mono text-[10px] px-1",
              day: "rounded-md text-sm",
              day_button:
                "size-8 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
              caption_label: "text-sm font-medium",
            }}
          />
        </div>

        {selectedMonday && (
          <div className="bg-muted/40 rounded-md p-3 text-sm">
            <div className="font-medium">
              {formatSprintDefaultName(selectedMonday)}
            </div>
            <div className="text-muted-foreground text-xs">
              {formatSprintRange(selectedMonday)}
            </div>
            {isOccupied && (
              <div className="text-destructive mt-1 text-xs">
                Ya existe un Sprint para esta semana.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedMonday || isOccupied || isCreating}
          >
            {isCreating && <Spinner data-icon="inline-start" />}
            Crear Sprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

