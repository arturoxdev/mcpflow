import { NextResponse } from 'next/server'
import { boardService } from '@/server'
import { getAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const { boardId } = await params
  const board = await boardService.getById(boardId, session.userId)

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  return NextResponse.json(board)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const { boardId } = await params
  const board = await boardService.getById(boardId, session.userId)

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const patch: { name?: string; publicInboxEnabled?: boolean } = {}

  if (typeof body?.name === "string") {
    const trimmed = body.name.trim()
    if (!trimmed) {
      return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
    }
    patch.name = trimmed
  }

  if (typeof body?.publicInboxEnabled === "boolean") {
    patch.publicInboxEnabled = body.publicInboxEnabled
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'no fields to update' }, { status: 400 })
  }

  const updated = await boardService.update(boardId, session.userId, patch)
  return NextResponse.json(updated)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const { boardId } = await params
  const board = await boardService.getById(boardId, session.userId)

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  await boardService.delete(boardId, session.userId)

  return NextResponse.json({ success: true })
}
