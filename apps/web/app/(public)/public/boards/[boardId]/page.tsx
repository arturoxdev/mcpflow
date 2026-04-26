import { notFound } from "next/navigation"
import { boardService } from "@repo/core"

import { PublicInboxClosed } from "@/components/public/PublicInboxClosed"
import { PublicTaskForm } from "@/components/public/PublicTaskForm"

interface Props {
  params: Promise<{ boardId: string }>
}

export const dynamic = "force-dynamic"

export default async function PublicBoardPage({ params }: Props) {
  const { boardId } = await params
  const board = await boardService.getByIdPublic(boardId)

  if (!board) {
    notFound()
  }

  if (!board.publicInboxEnabled) {
    return <PublicInboxClosed boardName={board.name} />
  }

  return <PublicTaskForm boardId={board.id} boardName={board.name} />
}
