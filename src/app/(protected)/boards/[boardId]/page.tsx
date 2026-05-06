import { auth } from "@clerk/nextjs/server"
import { boardService } from "@/server"
import { notFound } from "next/navigation"

import { BoardPageClient } from "./BoardPageClient"

interface BoardPageProps {
  params: Promise<{ boardId: string }>
}

export const dynamic = "force-dynamic"

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params
  const session = await auth()

  if (!session.userId) {
    notFound()
  }

  const board = await boardService.getById(boardId, session.userId)

  if (!board) {
    notFound()
  }

  return <BoardPageClient key={board.id} boardId={boardId} initialBoard={board} />
}
