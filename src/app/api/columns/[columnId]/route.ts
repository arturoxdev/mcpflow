import { NextResponse } from 'next/server'
import { columnService, ColumnHasTasksError } from '@/server'
import { getAuth } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const { columnId } = await params

  const body = await request.json()
  const patch: { name?: string; color?: string; isClosed?: boolean } = {}
  if (typeof body?.name === 'string') {
    const name = body.name.trim()
    if (!name) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }
    if (name.length > 50) {
      return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 })
    }
    patch.name = name
  }
  if (typeof body?.color === 'string') patch.color = body.color
  if (typeof body?.isClosed === 'boolean') patch.isClosed = body.isClosed

  try {
    const updated = await columnService.update(columnId, session.userId, patch)
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof Error && e.message === 'Column not found') {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 })
    }
    throw e
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const { columnId } = await params

  try {
    await columnService.delete(columnId, session.userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof ColumnHasTasksError) {
      return NextResponse.json(
        { error: 'COLUMN_HAS_TASKS', message: 'Mueve las tasks antes de borrar la columna' },
        { status: 409 }
      )
    }
    if (e instanceof Error && e.message === 'Column not found') {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 })
    }
    throw e
  }
}
