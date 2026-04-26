"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, useUser, UserButton } from "@clerk/nextjs"
import { BookOpen, KeyRound } from "lucide-react"
import type { Board, Task } from "@repo/core"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ThemeToggle } from "@/components/theme-toggle"
import { openCommandPalette } from "@/components/command-palette"
import { boardsStore } from "@/lib/boards-store"
import { tasksStore } from "@/lib/tasks-store"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const { getToken } = useAuth()
  const { user } = useUser()
  const [boards, setBoards] = useState<Board[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [bRes, tRes] = await Promise.all([
        fetch("/api/boards", { headers }),
        fetch("/api/tasks", { headers }),
      ])
      if (bRes.ok) setBoards(await bRes.json())
      if (tRes.ok) setTasks(await tRes.json())
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchAll()
    const u1 = boardsStore.subscribe(fetchAll)
    const u2 = tasksStore.subscribe(fetchAll)
    return () => {
      u1()
      u2()
    }
  }, [fetchAll])

  const totalCount = tasks.length
  const countByBoard = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of tasks) m.set(t.boardId, (m.get(t.boardId) ?? 0) + 1)
    return m
  }, [tasks])

  const firstName = user?.firstName ?? user?.username ?? "Tú"
  const initial = firstName.charAt(0).toUpperCase()
  const email = user?.primaryEmailAddress?.emailAddress ?? ""

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <Link
          href="/boards"
          className="px-2 py-1.5 text-xl font-semibold tracking-tight group-data-[collapsible=icon]:hidden"
        >
          <span className="text-foreground">Zen</span>
          <span className="text-primary">Board</span>
        </Link>

        <div className="px-1 group-data-[collapsible=icon]:hidden">
          <InputGroup
            onClick={openCommandPalette}
            className="cursor-pointer"
          >
            <InputGroupInput
              placeholder="Buscar…"
              readOnly
              onFocus={(e) => {
                e.target.blur()
                openCommandPalette()
              }}
              className="cursor-pointer"
            />
            <InputGroupAddon align="inline-end">
              <kbd className="text-muted-foreground font-mono text-[10px]">
                ⌘K
              </kbd>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/general"}
                  tooltip="General"
                  render={<Link href="/general" />}
                >
                  <span>General</span>
                  {!isLoading && (
                    <span className="text-muted-foreground ml-auto font-mono text-xs">
                      {totalCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider">
            Boards
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuSkeleton />
                    </SidebarMenuItem>
                  ))
                : boards.map((b) => {
                    const href = `/boards/${b.id}`
                    const isActive = pathname.startsWith(href)
                    return (
                      <SidebarMenuItem key={b.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={b.name}
                          render={<Link href={href} />}
                        >
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              isActive
                                ? "bg-accent"
                                : "bg-muted-foreground/40"
                            )}
                          />
                          <span className="truncate">{b.name}</span>
                          <span className="text-muted-foreground ml-auto font-mono text-xs">
                            {countByBoard.get(b.id) ?? 0}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/api-keys"}
                  tooltip="API Keys"
                  render={<Link href="/api-keys" />}
                >
                  <KeyRound className="size-4" />
                  <span>API Keys</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/api-docs"}
                  tooltip="API Docs"
                  render={<Link href="/api-docs" />}
                >
                  <BookOpen className="size-4" />
                  <span>API Docs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-1">
        <div className="relative group-data-[collapsible=icon]:hidden">
          <div
            aria-hidden
            className="hover:bg-sidebar-accent flex items-center gap-2.5 rounded-md p-1.5 transition-colors"
          >
            <span className="from-chart-2 to-chart-3 grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-semibold text-[#0e131b]">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-foreground truncate text-xs font-medium">
                {firstName}
              </div>
              {email && (
                <div className="text-muted-foreground truncate font-mono text-[10px]">
                  {email}
                </div>
              )}
            </div>
          </div>
          <div className="absolute inset-0 opacity-0 [&>*]:size-full [&_button]:size-full">
            <UserButton />
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 px-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-0">
          <div className="group-data-[collapsible=icon]:hidden" />
          <div className="hidden group-data-[collapsible=icon]:block">
            <UserButton />
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
