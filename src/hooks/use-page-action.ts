"use client"

import { useEffect } from "react"

import { pageActionsStore, type PageActions } from "@/lib/page-actions-store"

export function usePageAction(actions: PageActions): void {
  const key = actions ? JSON.stringify(actions) : ""
  useEffect(() => {
    pageActionsStore.set(actions)
    return () => {
      pageActionsStore.set(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
