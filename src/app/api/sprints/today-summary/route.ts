import { NextResponse } from 'next/server'
import { sprintService, taskService, SPRINT_DAYS } from '@/server'
import type { SprintDay } from '@/server'
import { getAuth } from '@/lib/auth'

const DAY_SET: ReadonlySet<string> = new Set(SPRINT_DAYS)

// GET /api/sprints/today-summary?weekStart=YYYY-MM-DD&today=mon
// Single round trip for the sidebar Semana item: returns the current Sprint
// (if one exists for `weekStart`) and the count of Open Tasks scheduled for
// `today`. The client passes both parameters because timezone is client-owned.
export async function GET(request: Request) {
  const session = await getAuth(request)
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const url = new URL(request.url)
  const weekStart = url.searchParams.get('weekStart')
  const today = url.searchParams.get('today')

  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json(
      { error: 'weekStart=YYYY-MM-DD is required' },
      { status: 400 }
    )
  }
  if (!today || !DAY_SET.has(today)) {
    return NextResponse.json(
      { error: 'today must be one of mon..sun' },
      { status: 400 }
    )
  }

  const sprint = await sprintService.getByStartDate(weekStart, session.userId)
  if (!sprint) {
    return NextResponse.json({ sprintId: null, sprintName: null, openTodayCount: 0 })
  }

  const openTodayCount = await taskService.countOpenForSprintDay(
    sprint.id,
    today as SprintDay,
    session.userId
  )

  return NextResponse.json({
    sprintId: sprint.id,
    sprintName: sprint.name,
    sprintStartDate: sprint.startDate,
    openTodayCount,
  })
}
