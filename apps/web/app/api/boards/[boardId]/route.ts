import { NextResponse } from 'next/server'
import { boardService } from '@repo/core'
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
  const rawName = typeof body?.name === "string" ? body.name.trim() : ""
  if (!rawName) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const updated = await boardService.update(
    boardId,
    session.userId,
    rawName,
    board.description
  )
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
