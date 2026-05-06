import { NextResponse } from 'next/server'
import { boardService } from '@/server'
import { getAuth } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }

  const { boardId } = await params

  try {
    const archived = await boardService.archive(boardId, session.userId)
    return NextResponse.json(archived)
  } catch {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }
}
