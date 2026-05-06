import { NextResponse } from 'next/server'
import { boardService, columnService, taskService } from '@/server'

const TITLE_MAX = 120
const DESC_MAX = 5000

export async function POST(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params
  const board = await boardService.getByIdPublic(boardId)

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  if (!board.publicInboxEnabled) {
    return NextResponse.json({ error: 'Public inbox is disabled' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const rawTitle = typeof body?.title === 'string' ? body.title.trim() : ''
  const rawDescription = typeof body?.description === 'string' ? body.description.trim() : ''

  if (!rawTitle) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (rawTitle.length > TITLE_MAX) {
    return NextResponse.json({ error: `Title is too long (max ${TITLE_MAX} chars)` }, { status: 400 })
  }
  if (rawDescription.length > DESC_MAX) {
    return NextResponse.json({ error: `Description is too long (max ${DESC_MAX} chars)` }, { status: 400 })
  }

  const userColumns = await columnService.ensureForUser(board.userId)
  const firstColumn = userColumns[0]
  if (!firstColumn) {
    return NextResponse.json({ error: 'No columns configured' }, { status: 500 })
  }

  await taskService.create({
    title: rawTitle,
    description: rawDescription,
    priority: 'medium',
    columnId: firstColumn.id,
    source: 'external',
    createdBy: null,
    boardId,
    userId: board.userId,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
