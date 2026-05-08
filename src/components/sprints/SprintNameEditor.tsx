"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { displaySprintName } from "@/lib/sprint-week"
import { sprintsStore } from "@/lib/sprints-store"
import { cn } from "@/lib/utils"
import type { Sprint } from "@/server"

interface SprintNameEditorProps {
  sprint: Sprint
  onUpdated: (sprint: Sprint) => void
}

export function SprintNameEditor({ sprint, onUpdated }: SprintNameEditorProps) {
  const { getToken } = useAuth()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  const beginEdit = () => {
    setDraft(sprint.name ?? "")
    setEditing(true)
  }

  const save = async () => {
    const trimmed = draft.trim()
    const nextName = trimmed.length > 0 ? trimmed : null
    if ((sprint.name ?? null) === nextName) {
      setEditing(false)
      return
    }
    try {
      const token = await getToken()
      const res = await fetch(`/api/sprints/${sprint.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: nextName }),
      })
      if (!res.ok) throw new Error()
      const updated: Sprint = await res.json()
      onUpdated(updated)
      sprintsStore.notify()
    } catch {
      toast.error("Error al renombrar el Sprint")
    } finally {
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            save()
          } else if (e.key === "Escape") {
            e.preventDefault()
            setEditing(false)
          }
        }}
        placeholder="Nombre del Sprint (vacío = default)"
        className="max-w-md"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={beginEdit}
      className={cn(
        "hover:text-foreground rounded-sm text-left font-serif text-4xl font-bold italic outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/50"
      )}
    >
      {displaySprintName(sprint)}
    </button>
  )
}
