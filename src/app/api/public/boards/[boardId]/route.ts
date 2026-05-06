import { NextResponse } from 'next/server'
import { boardService } from '@/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params
  const board = await boardService.getByIdPublic(boardId)

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: board.id,
    name: board.name,
    publicInboxEnabled: board.publicInboxEnabled,
  })
}
