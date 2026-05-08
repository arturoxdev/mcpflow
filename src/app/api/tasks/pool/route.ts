import { NextResponse } from 'next/server'
import { taskService } from '@/server'
import { getAuth } from '@/lib/auth'

// GET /api/tasks/pool
// Open Tasks (column.is_closed = false) of active Boards, not assigned to any
// Sprint. The pool that feeds the Sprint detail's left selector.
export async function GET(request: Request) {
  const session = await getAuth(request)
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const tasks = await taskService.getPool(session.userId)
  return NextResponse.json(tasks)
}
