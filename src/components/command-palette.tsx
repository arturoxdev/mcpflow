"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Plus } from "lucide-react"
import type { Board } from "@/server"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { boardsStore } from "@/lib/boards-store"

const NEW_TASK_PATH = "/boards/tasks/new"
const OPEN_EVENT = "command-palette:open"

export function openCommandPalette() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(OPEN_EVENT))
}

function getBoardIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/boards\/([^/]+)/)
  if (!match) return null
  const segment = match[1]
  if (segment === "tasks") return null
  return segment
}

export function CommandPalette() {
  const router = useRouter()
  const pathname = usePathname()
  const { getToken } = useAuth()
  const [open, setOpen] = useState(false)
  const [boards, setBoards] = useState<Board[]>([])

  const fetchBoards = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch("/api/boards", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setBoards(await res.json())
    } catch {
      // ignore — palette still usable for "Crear tarea"
    }
  }, [getToken])

  useEffect(() => {
    const refreshBoards = () => {
      void fetchBoards()
    }
    refreshBoards()
    const unsub = boardsStore.subscribe(refreshBoards)
    return unsub
  }, [fetchBoards])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey
      if (!isModifier || e.key.toLowerCase() !== "k") return
      if (e.shiftKey || e.altKey) return
      e.preventDefault()
      setOpen((v) => !v)
    }
    const onOpenEvent = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_EVENT, onOpenEvent)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_EVENT, onOpenEvent)
    }
  }, [])

  const runCreateTask = () => {
    const boardId = getBoardIdFromPathname(pathname)
    setOpen(false)
    router.push(boardId ? `${NEW_TASK_PATH}?boardId=${boardId}` : NEW_TASK_PATH)
  }

  const runGoToBoard = (boardId: string) => {
    setOpen(false)
    router.push(`/boards/${boardId}`)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Paleta de comandos"
      description="Buscá boards o ejecutá una acción"
    >
      <Command>
        <CommandInput placeholder="Buscar boards o ejecutar una acción…" />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup heading="Acciones">
            <CommandItem
              value="crear tarea nueva new task"
              onSelect={runCreateTask}
            >
              <Plus />
              <span>Crear tarea</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          {boards.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Boards">
                {boards.map((b) => (
                  <CommandItem
                    key={b.id}
                    value={`board ${b.name}`}
                    onSelect={() => runGoToBoard(b.id)}
                  >
                    <span className="bg-accent size-1.5 shrink-0 rounded-full" />
                    <span>{b.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
