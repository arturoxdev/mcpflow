import { NextResponse } from 'next/server'
import { columnService, taskService } from '@repo/core'
import { getAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const { columnId } = await params

  const column = await columnService.getById(columnId, session.userId)
  if (!column) {
    return NextResponse.json({ error: 'Column not found' }, { status: 404 })
  }

  const tasks = await taskService.getByColumn(columnId, session.userId)
  return NextResponse.json(tasks)
}
