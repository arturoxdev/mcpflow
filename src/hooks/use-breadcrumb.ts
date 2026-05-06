"use client"

import { useEffect } from "react"

import { breadcrumbStore, type BreadcrumbItem } from "@/lib/breadcrumb-store"

export function useBreadcrumb(items: BreadcrumbItem[]): void {
  const key = JSON.stringify(items)
  useEffect(() => {
    breadcrumbStore.set(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
