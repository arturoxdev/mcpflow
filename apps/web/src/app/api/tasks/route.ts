import { NextResponse } from 'next/server'
import { taskService } from '@/server'
import { getAuth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const tasks = await taskService.getAllByUser(session.userId)
  return NextResponse.json(tasks)
}
