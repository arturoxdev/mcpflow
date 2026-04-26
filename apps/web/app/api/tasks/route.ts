import { NextResponse } from 'next/server'
import { taskService } from '@repo/core'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return new NextResponse("No autorizado", { status: 401 })
  }
  const tasks = await taskService.getAllByUser(userId)
  return NextResponse.json(tasks)
}
