import { NextResponse } from 'next/server'
import { taskService } from '@repo/core'
import { getAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string; taskId: string }> }
) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const { boardId, taskId } = await params
  const task = await taskService.getById(taskId, boardId, session.userId)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  return NextResponse.json(task)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string; taskId: string }> }
) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const { boardId, taskId } = await params
  const task = await taskService.getById(taskId, boardId, session.userId)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const body = await request.json()
  const { title, description, priority, status } = body

  if (title !== undefined) task.title = title
  if (description !== undefined) task.description = description
  if (priority !== undefined) task.priority = priority
  if (status !== undefined) task.status = status

  await taskService.update(taskId, boardId, session.userId, task)

  return NextResponse.json(task)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ boardId: string; taskId: string }> }
) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const { boardId, taskId } = await params
  const task = await taskService.getById(taskId, boardId, session.userId)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  await taskService.delete(taskId, boardId, session.userId)
  return NextResponse.json({ success: true })
}
