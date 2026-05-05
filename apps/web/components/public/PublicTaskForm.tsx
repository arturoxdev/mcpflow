"use client"

import { useState, useTransition } from "react"
import { Check, Inbox } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  boardId: string
  boardName: string
}

const TITLE_MAX = 120
const DESC_MAX = 5000

export function PublicTaskForm({ boardId, boardName }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const trimmedTitle = title.trim()
  const canSubmit = trimmedTitle.length > 0 && trimmedTitle.length <= TITLE_MAX && description.length <= DESC_MAX && !isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    startTransition(async () => {
      try {
        const res = await fetch(`/api/public/boards/${boardId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmedTitle,
            description: description.trim(),
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error ?? "Failed")
        }
        setSubmitted(true)
        setTitle("")
        setDescription("")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo enviar")
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <Check className="text-accent" />
        </div>
        <h1 className="text-2xl font-medium tracking-tight">¡Recibido!</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Tu petición llegó al buzón de{" "}
          <span className="font-medium">{boardName}</span>. Pronto la verán.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSubmitted(false)}
        >
          Enviar otra
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xl flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em]">
          <Inbox className="size-3.5" />
          Buzón público
        </div>
        <h1 className="text-3xl font-medium tracking-tight">
          Buzón de <span className="text-accent">{boardName}</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Deja tu petición y la verán pronto. Sólo necesitas un título y una
          descripción.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="public-title" className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Título
        </Label>
        <Input
          id="public-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          placeholder="Ej. Necesito un cambio en el landing"
          autoFocus
          required
        />
        <div className="text-muted-foreground text-right font-mono text-[10px]">
          {trimmedTitle.length}/{TITLE_MAX}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="public-description" className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Descripción
        </Label>
        <Textarea
          id="public-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={DESC_MAX}
          placeholder="Cuéntales el detalle de tu petición..."
          rows={8}
        />
        <div className="text-muted-foreground text-right font-mono text-[10px]">
          {description.length}/{DESC_MAX}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          {isPending && <Spinner data-icon="inline-start" />}
          Enviar
        </Button>
      </div>
    </form>
  )
}
