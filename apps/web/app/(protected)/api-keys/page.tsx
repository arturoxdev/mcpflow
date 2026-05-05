"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import type { ApiKey } from "@repo/core"
import { KeyRound, Plus, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { CodeBlock } from "@/components/api-docs/code-block"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function ApiKeysPage() {
  useBreadcrumb([{ label: "API Keys" }])
  const { getToken } = useAuth()

  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [revealed, setRevealed] = useState<{
    apiKey: ApiKey
    plainToken: string
  } | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null)
  const [deleting, setDeleting] = useState(false)

  const authedHeaders = useCallback(async () => {
    const token = await getToken()
    return { Authorization: `Bearer ${token}` }
  }, [getToken])

  const fetchKeys = useCallback(async () => {
    try {
      const headers = await authedHeaders()
      const res = await fetch("/api/api-keys", { headers })
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      setKeys(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [authedHeaders])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const headers = await authedHeaders()
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) throw new Error("Failed to create")
      const data = await res.json()
      setRevealed(data)
      setNewName("")
      setCreateOpen(false)
      fetchKeys()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear el token")
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const headers = await authedHeaders()
      const res = await fetch(`/api/api-keys/${deleteTarget.id}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) throw new Error("Failed to revoke")
      toast.success(`Token "${deleteTarget.name}" eliminado`)
      setDeleteTarget(null)
      fetchKeys()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl font-bold italic">API Keys</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Tokens personales para que un Skill o agente IA acceda a tu API
            sin sesión de navegador. Manda el token en el header{" "}
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
              Authorization: Bearer
            </code>
            .
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Generar token
        </Button>
      </header>

      {revealed && (
        <Alert>
          <TriangleAlert />
          <AlertTitle>Copia tu token ahora</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              No volverás a verlo. Si lo pierdes, genera uno nuevo y revoca
              este.
            </span>
            <CodeBlock code={revealed.plainToken} />
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setRevealed(null)}
            >
              Ya lo guardé
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="border-border/60 text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center text-sm">
            <KeyRound className="size-6 opacity-60" />
            <span>Aún no tienes tokens. Genera uno para empezar.</span>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {keys.map((k) => (
              <li
                key={k.id}
                className="border-border/60 flex items-center gap-4 rounded-lg border p-4"
              >
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                  <KeyRound className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-foreground truncate text-sm font-medium">
                    {k.name}
                  </span>
                  <span className="text-muted-foreground truncate font-mono text-xs">
                    {k.prefix}…
                  </span>
                </div>
                <div className="text-muted-foreground hidden flex-col items-end gap-0.5 text-xs sm:flex">
                  <span>Último uso: {formatDate(k.lastUsedAt)}</span>
                  <span>Creado: {formatDate(k.createdAt)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Eliminar ${k.name}`}
                  onClick={() => setDeleteTarget(k)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar nuevo token</DialogTitle>
            <DialogDescription>
              Dale un nombre para identificarlo después (ej. &quot;Mi
              Skill&quot;, &quot;Laptop trabajo&quot;).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="api-key-name">Nombre</FieldLabel>
                <Input
                  id="api-key-name"
                  autoFocus
                  placeholder="Mi Skill de Claude"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={100}
                />
                <FieldDescription>
                  Solo es para que tú lo reconozcas en la lista.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!newName.trim() || creating}>
                {creating ? "Generando…" : "Generar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar token?</DialogTitle>
            <DialogDescription>
              El token &quot;{deleteTarget?.name}&quot; dejará de funcionar
              inmediatamente. Cualquier Skill que lo use va a recibir 401.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRevoke}
              disabled={deleting}
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
