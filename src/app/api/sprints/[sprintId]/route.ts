import { NextResponse } from 'next/server'
import { sprintService } from '@/server'
import { getAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await getAuth(request)
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const { sprintId } = await params
  const sprint = await sprintService.getById(sprintId, session.userId)
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
  return NextResponse.json(sprint)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await getAuth(request)
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const { sprintId } = await params
  const sprint = await sprintService.getById(sprintId, session.userId)
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const patch: { name?: string | null } = {}

  if ('name' in body) {
    if (body.name === null) {
      patch.name = null
    } else if (typeof body.name === 'string') {
      const trimmed = body.name.trim()
      patch.name = trimmed.length > 0 ? trimmed : null
    } else {
      return NextResponse.json(
        { error: 'name must be a string or null' },
        { status: 400 }
      )
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'no fields to update' }, { status: 400 })
  }

  const updated = await sprintService.update(sprintId, session.userId, patch)
  return NextResponse.json(updated)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await getAuth(request)
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const { sprintId } = await params
  const sprint = await sprintService.getById(sprintId, session.userId)
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })

  await sprintService.delete(sprintId, session.userId)
  return NextResponse.json({ success: true })
}
