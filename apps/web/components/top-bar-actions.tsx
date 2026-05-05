"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Bell, Filter, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { pageActionsStore } from "@/lib/page-actions-store"

const getSnapshot = pageActionsStore.get

type View = "kanban" | "lista"

export function TopBarActions() {
  const actions = useSyncExternalStore(
    pageActionsStore.subscribe,
    getSnapshot,
    getSnapshot
  )

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const view: View = searchParams.get("view") === "lista" ? "lista" : "kanban"

  const hideDefaults = actions?.hideDefaults ?? false
  const primary = actions?.primary ?? null
  const secondary = actions?.secondary ?? null

  const handleViewChange = (values: string[]) => {
    const next = values[0]
    if (!next || next === "foco") return
    const params = new URLSearchParams(searchParams.toString())
    if (next === "kanban") params.delete("view")
    else params.set("view", next)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex items-center gap-2">
      {!hideDefaults && (
        <>
          <ToggleGroup
            value={[view]}
            onValueChange={handleViewChange}
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
          >
            <ToggleGroupItem value="kanban" aria-label="Vista kanban">
              Kanban
            </ToggleGroupItem>
            <ToggleGroupItem value="lista" aria-label="Vista lista">
              Lista
            </ToggleGroupItem>
            <ToggleGroupItem
              value="foco"
              aria-label="Vista foco"
              disabled
            >
              Foco
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hidden md:inline-flex"
          >
            <Filter data-icon="inline-start" />
            Filtrar
          </Button>
        </>
      )}

      {primary && (
        <Button size="sm" render={<Link href={primary.href} />}>
          <Plus data-icon="inline-start" />
          {primary.label}
        </Button>
      )}

      {secondary && (
        <Button
          variant={secondary.variant ?? "outline"}
          size="sm"
          render={<Link href={secondary.href} />}
        >
          {secondary.label}
        </Button>
      )}

      {!hideDefaults && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notificaciones"
          className="text-muted-foreground"
        >
          <Bell />
        </Button>
      )}
    </div>
  )
}
