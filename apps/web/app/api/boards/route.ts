import { NextResponse } from 'next/server'
import { boardService } from '@repo/core'
import { getAuth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const boards = await boardService.getAll(session.userId)
  return NextResponse.json(boards)
}

export async function POST(request: Request) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const body = await request.json()
  const { name, description } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const newBoard = await boardService.create(name, session.userId, description)

  return NextResponse.json(newBoard, { status: 201 })
}
