import { NextResponse } from 'next/server'
import { columnService } from '@/server'
import { getAuth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }

  const columns = await columnService.ensureForUser(session.userId)
  return NextResponse.json(columns)
}

export async function POST(request: Request) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }

  const body = await request.json()
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const color = typeof body?.color === 'string' ? body.color : undefined

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (name.length > 50) {
    return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 })
  }

  const column = await columnService.create(session.userId, { name, color })
  return NextResponse.json(column, { status: 201 })
}
