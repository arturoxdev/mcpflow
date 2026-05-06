import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { apiKeyService } from '@/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const { id } = await params

  try {
    await apiKeyService.revoke(id, userId)
  } catch {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
