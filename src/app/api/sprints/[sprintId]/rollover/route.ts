import { NextResponse } from 'next/server'
import { sprintService } from '@/server'
import { getAuth } from '@/lib/auth'

// POST /api/sprints/:sprintId/rollover
// Moves Open Tasks of the Sprint immediately preceding :sprintId back into the
// pool (clears sprint_*). Returns { moved: number }.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await getAuth(request)
  if (!session) return new NextResponse('No autorizado', { status: 401 })

  const { sprintId } = await params
  const target = await sprintService.getById(sprintId, session.userId)
  if (!target) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })

  const previous = await sprintService.getPrevious(target.startDate, session.userId)
  if (!previous) return NextResponse.json({ moved: 0 })

  const moved = await sprintService.rolloverFrom(previous.id, session.userId)
  return NextResponse.json({ moved })
}
