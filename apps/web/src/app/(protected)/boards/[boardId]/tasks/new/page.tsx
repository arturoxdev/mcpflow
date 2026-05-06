import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ boardId: string }>
}

export default async function LegacyNewTaskRedirect({ params }: PageProps) {
  const { boardId } = await params
  redirect(`/boards/tasks/new?boardId=${boardId}`)
}
