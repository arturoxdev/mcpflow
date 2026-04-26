"use client"

import { useEffect, useState, useTransition } from "react"
import { Check, Copy, Inbox } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"

interface Props {
  boardId: string
  initialEnabled: boolean
  onChange?: (enabled: boolean) => void
}

export function SharePublicInboxPopover({
  boardId,
  initialEnabled,
  onChange,
}: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setEnabled(initialEnabled)
  }, [initialEnabled])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const url = origin ? `${origin}/public/boards/${boardId}` : ""

  const toggle = (next: boolean) => {
    const previous = enabled
    setEnabled(next)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/boards/${boardId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicInboxEnabled: next }),
        })
        if (!res.ok) throw new Error("Failed")
        onChange?.(next)
        toast.success(next ? "Buzón público activado" : "Buzón público desactivado")
      } catch {
        setEnabled(previous)
        toast.error("No se pudo actualizar el buzón")
      }
    })
  }

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copiado")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Compartir buzón"
          >
            <Inbox data-icon="inline-start" />
            Compartir buzón
          </Button>
        }
      />
      <PopoverContent align="end" className="w-96 gap-4">
        <div>
          <div className="text-muted-foreground text-[11px] uppercase tracking-[0.16em]">
            Buzón público
          </div>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            Comparte un link con tus clientes para que dejen peticiones sin loguearse. Sólo verán un formulario de título y descripción.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="public-inbox-toggle" className="text-sm">
            Recibir tareas desde link público
          </Label>
          <Switch
            id="public-inbox-toggle"
            checked={enabled}
            onCheckedChange={toggle}
            disabled={isPending}
          />
        </div>

        {enabled ? (
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-[11px] uppercase tracking-[0.16em]">
              Link
            </Label>
            <div className="flex items-center gap-2">
              <Input value={url} readOnly className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copy}
                aria-label="Copiar link"
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs italic">
            Cuando lo actives, el link mostrará el formulario público.
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
