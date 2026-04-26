import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { apiKeyService } from '@repo/core'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const keys = await apiKeyService.list(userId)
  return NextResponse.json(keys)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const { name } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    )
  }

  const { apiKey, plainToken } = await apiKeyService.create(
    userId,
    name.trim()
  )

  return NextResponse.json({ apiKey, plainToken }, { status: 201 })
}
