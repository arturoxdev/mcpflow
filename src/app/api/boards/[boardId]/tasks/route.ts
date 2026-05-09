import { NextResponse } from 'next/server'
import { taskService, boardService, columnService } from '@/server'
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

  const boardTasks = await taskService.getAll(boardId, session.userId)
  return NextResponse.json(boardTasks)
}

export async function POST(
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

  const body = await request.json()
  const { title, description, priority, columnId, effort } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (effort !== undefined && effort !== null && effort !== 'low' && effort !== 'high') {
    return NextResponse.json({ error: "effort must be 'low', 'high', or null" }, { status: 400 })
  }

  let resolvedColumnId: string | undefined
  if (typeof columnId === 'string' && columnId) {
    const column = await columnService.getById(columnId, session.userId)
    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 400 })
    }
    resolvedColumnId = column.id
  } else {
    const userColumns = await columnService.ensureForUser(session.userId)
    if (userColumns.length === 0) {
      return NextResponse.json(
        { error: 'No columns configured. Create one first.' },
        { status: 400 }
      )
    }
    resolvedColumnId = userColumns[0]!.id
  }

  const newTask = await taskService.create({
    title,
    description: description || '',
    priority: priority,
    columnId: resolvedColumnId,
    boardId,
    userId: session.userId,
    effort: effort ?? null,
  })

  return NextResponse.json(newTask, { status: 201 })
}
