import { NextResponse } from 'next/server'
import {
  sprintService,
  SprintStartDateNotMondayError,
  SprintWeekTakenError,
} from '@/server'
import { getAuth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse('No autorizado', { status: 401 })
  }
  const sprints = await sprintService.list(session.userId)
  return NextResponse.json(sprints)
}

export async function POST(request: Request) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse('No autorizado', { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const { startDate, name } = body ?? {}

  if (typeof startDate !== 'string') {
    return NextResponse.json(
      { error: 'startDate is required (YYYY-MM-DD, must be a Monday)' },
      { status: 400 }
    )
  }

  try {
    const sprint = await sprintService.create(session.userId, {
      startDate,
      name: typeof name === 'string' && name.trim() ? name.trim() : undefined,
    })
    return NextResponse.json(sprint, { status: 201 })
  } catch (e) {
    if (e instanceof SprintStartDateNotMondayError) {
      return NextResponse.json(
        { error: 'startDate must be a Monday' },
        { status: 400 }
      )
    }
    if (e instanceof SprintWeekTakenError) {
      return NextResponse.json(
        { error: 'A Sprint already exists for that week' },
        { status: 409 }
      )
    }
    throw e
  }
}
