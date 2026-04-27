import { NextResponse } from 'next/server'
import { columnService } from '@repo/core'
import { getAuth } from '@/lib/auth'

export async function PATCH(request: Request) {
  const session = await getAuth(request)
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }

  const body = await request.json()
  const ids = Array.isArray(body?.ids) ? body.ids : null
  if (!ids || !ids.every((id: unknown) => typeof id === 'string')) {
    return NextResponse.json({ error: 'ids must be an array of strings' }, { status: 400 })
  }

  try {
    const columns = await columnService.reorder(session.userId, ids)
    return NextResponse.json(columns)
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    throw e
  }
}
