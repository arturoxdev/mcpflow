import { NextResponse } from 'next/server'
import { taskService, boardService } from '@repo/core'
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
  const { title, description, priority, status } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const newTask = await taskService.create({
    title,
    description: description || '',
    priority: priority,
    status: status || 'todo',
    boardId,
    userId: session.userId,
  })

  return NextResponse.json(newTask, { status: 201 })
}
