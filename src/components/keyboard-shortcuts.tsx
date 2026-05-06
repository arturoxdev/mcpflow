"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

const NEW_TASK_PATH = "/boards/tasks/new"

function getBoardIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/boards\/([^/]+)/)
  if (!match) return null
  const segment = match[1]
  // /boards/tasks/new is the form route — no boardId
  if (segment === "tasks") return null
  return segment
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  )
}

export function KeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey
      if (!isModifier || e.key.toLowerCase() !== "n") return
      if (e.shiftKey || e.altKey) return
      if (isEditableTarget(e.target)) return
      if (pathname === NEW_TASK_PATH) return

      const boardId = getBoardIdFromPathname(pathname)
      e.preventDefault()
      router.push(
        boardId ? `${NEW_TASK_PATH}?boardId=${boardId}` : NEW_TASK_PATH
      )
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [pathname, router])

  return null
}
