import { Inbox } from "lucide-react"

interface Props {
  boardName: string
}

export function PublicInboxClosed({ boardName }: Props) {
  return (
    <div className="flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Inbox className="text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-medium tracking-tight">Buzón cerrado</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        El buzón de <span className="font-medium">{boardName}</span> no está
        recibiendo peticiones por ahora. Pídele al dueño del board que lo
        habilite y vuelve a intentarlo.
      </p>
    </div>
  )
}
