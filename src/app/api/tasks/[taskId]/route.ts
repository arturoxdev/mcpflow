import { NextResponse } from 'next/server'
import { taskService, SPRINT_DAYS } from '@/server'
import { getAuth } from '@/lib/auth'
import type { ScheduleTask, SprintDay } from '@/server'

const SPRINT_DAY_SET: ReadonlySet<string> = new Set(SPRINT_DAYS)

// PATCH /api/tasks/:taskId
// Currently only supports scheduling: setting / clearing sprint_id, sprint_day,
// sprint_position together. CRUD on other Task fields stays at
// /api/boards/:boardId/tasks/:taskId.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await getAuth(request)
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const { taskId } = await params
  const body = await request.json().catch(() => ({}))

  const hasScheduleKey =
    'sprintId' in body || 'sprintDay' in body || 'sprintPosition' in body
  if (!hasScheduleKey) {
    return NextResponse.json(
      { error: 'expected sprintId / sprintDay / sprintPosition' },
      { status: 400 }
    )
  }

  const { sprintId, sprintDay, sprintPosition } = body
  let payload: ScheduleTask

  if (sprintId === null) {
    if (sprintDay !== null || sprintPosition !== null) {
      return NextResponse.json(
        {
          error:
            'when sprintId is null, sprintDay and sprintPosition must also be null',
        },
        { status: 400 }
      )
    }
    payload = { sprintId: null, sprintDay: null, sprintPosition: null }
  } else {
    if (typeof sprintId !== 'string' || sprintId.length === 0) {
      return NextResponse.json({ error: 'sprintId must be a non-empty string' }, { status: 400 })
    }
    if (typeof sprintDay !== 'string' || !SPRINT_DAY_SET.has(sprintDay)) {
      return NextResponse.json(
        { error: 'sprintDay must be one of mon..sun' },
        { status: 400 }
      )
    }
    if (
      sprintPosition !== undefined &&
      sprintPosition !== null &&
      (typeof sprintPosition !== 'number' || !Number.isInteger(sprintPosition) || sprintPosition < 0)
    ) {
      return NextResponse.json(
        { error: 'sprintPosition must be a non-negative integer' },
        { status: 400 }
      )
    }
    payload = {
      sprintId,
      sprintDay: sprintDay as SprintDay,
      sprintPosition: typeof sprintPosition === 'number' ? sprintPosition : undefined,
    }
  }

  try {
    const updated = await taskService.schedule(taskId, session.userId, payload)
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof Error && e.message === 'Task not found') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    if (e instanceof Error && e.message === 'Sprint not found') {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }
    throw e
  }
}
