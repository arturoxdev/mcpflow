import { NextResponse } from 'next/server'
import { sprintService } from '@/server'
import { getAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await getAuth(request)
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const { sprintId } = await params
  const sprint = await sprintService.getById(sprintId, session.userId)
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })

  const tasks = await sprintService.getTasks(sprintId, session.userId)
  return NextResponse.json(tasks)
}
