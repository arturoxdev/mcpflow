"use client"

import { useCallback, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Check, ClipboardCopy, Sparkles, TriangleAlert } from "lucide-react"
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
import { useBreadcrumb } from "@/hooks/use-breadcrumb"

const SSR_PLACEHOLDER = "https://your-app.example"

const subscribe = () => () => {}
const getSnapshot = () => window.location.origin
const getServerSnapshot = () => SSR_PLACEHOLDER

const SKILL_TEMPLATE = `---
name: zenboard
description: Manage ZenBoard tasks and boards from Claude Code. Use when the user asks to create, edit, list or move tasks/projects in ZenBoard.
---

# ZenBoard skill

Use this skill to interact with the ZenBoard API and manage the user's boards and tasks.

## Auth

All requests require:

- Header: \`Authorization: Bearer {{ZB_API_KEY}}\`
- Base URL: \`{{API_BASE_URL}}\`

If a request returns 401 the token is invalid or revoked — tell the user to generate a new one at \`{{API_BASE_URL}}/api-keys\` and re-run this skill.

## Models

Board:

\`\`\`ts
{
  id: string         // ULID
  userId: string
  name: string
  description: string
  createdAt: string  // ISO 8601
}
\`\`\`

Task:

\`\`\`ts
{
  id: string
  userId: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'doing' | 'done'
  boardId: string
  pr: number         // correlative number inside the board
}
\`\`\`

## Capabilities

### List boards

\`\`\`bash
curl -s "{{API_BASE_URL}}/api/boards" \\
  -H "Authorization: Bearer {{ZB_API_KEY}}"
\`\`\`

### List tasks of a board

\`\`\`bash
curl -s "{{API_BASE_URL}}/api/boards/<boardId>/tasks" \\
  -H "Authorization: Bearer {{ZB_API_KEY}}"
\`\`\`

### Get a single task

\`\`\`bash
curl -s "{{API_BASE_URL}}/api/boards/<boardId>/tasks/<taskId>" \\
  -H "Authorization: Bearer {{ZB_API_KEY}}"
\`\`\`

### Create a task

Only \`title\` is required. \`priority\` defaults to \`medium\`, \`status\` defaults to \`todo\`.

\`\`\`bash
curl -s -X POST "{{API_BASE_URL}}/api/boards/<boardId>/tasks" \\
  -H "Authorization: Bearer {{ZB_API_KEY}}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Write launch announcement",
    "description": "Draft the blog post and social copy",
    "priority": "high",
    "status": "doing"
  }'
\`\`\`

### Edit a task (also moves status)

Send any subset of \`{ title, description, priority, status }\`. To "move" a task, send \`{ "status": "done" }\` (or \`"todo"\`/\`"doing"\`).

\`\`\`bash
curl -s -X PATCH "{{API_BASE_URL}}/api/boards/<boardId>/tasks/<taskId>" \\
  -H "Authorization: Bearer {{ZB_API_KEY}}" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "done" }'
\`\`\`

## Workflow tips

- Resolve the target board first via "List boards"; let the user pick one if multiple match.
- For a "complete this task" request, use the edit endpoint with \`{ "status": "done" }\`.
- Never try to delete tasks from this skill — that operation is intentionally not exposed.
`

type CreateApiKeyResponse = {
  apiKey: { id: string; name: string; prefix: string }
  plainToken: string
}

export default function SkillPage() {
  useBreadcrumb([{ label: "Skill" }])
  const { getToken } = useAuth()

  const origin = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const baseUrl = process.env.NEXT_PUBLIC_LIVE_URL || origin

  const [dialogOpen, setDialogOpen] = useState(false)
  const [tokenName, setTokenName] = useState("")
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState<{
    name: string
    plainToken: string
  } | null>(null)

  const fillTemplate = useCallback(
    (token: string) =>
      SKILL_TEMPLATE.replaceAll("{{API_BASE_URL}}", baseUrl).replaceAll(
        "{{ZB_API_KEY}}",
        token
      ),
    [baseUrl]
  )

  const handleGenerateAndCopy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenName.trim()) return
    setGenerating(true)
    try {
      const clerkToken = await getToken()
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clerkToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: tokenName.trim() }),
      })
      if (!res.ok) throw new Error("No se pudo generar el token")
      const data = (await res.json()) as CreateApiKeyResponse
      const filled = fillTemplate(data.plainToken)
      await navigator.clipboard.writeText(filled)
      setRevealed({ name: data.apiKey.name, plainToken: data.plainToken })
      setTokenName("")
      setDialogOpen(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      toast.success("SKILL.md copiado al portapapeles")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo generar el token"
      )
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-4xl font-bold italic">Skill</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Un{" "}
            <Link
              href="https://docs.claude.com/en/docs/claude-code/skills"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              skill de Claude Code
            </Link>{" "}
            listo para copiar y pegar. Lo guardas en{" "}
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
              ~/.claude/skills/zenboard/SKILL.md
            </code>{" "}
            y a partir de ahí Claude Code puede crear, editar y listar tus
            tasks y boards. Al copiar generamos una API key nueva y la
            inyectamos al archivo.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} variant="outline">
          {copied ? <Check /> : <ClipboardCopy />}
          {copied ? "Copiado" : "Copiar SKILL.md"}
        </Button>
      </header>

      {revealed && (
        <Alert>
          <TriangleAlert />
          <AlertTitle>Guarda tu token</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              El token{" "}
              <strong className="text-foreground">{revealed.name}</strong> ya
              está dentro del SKILL.md que copiaste. Esta es la única vez que
              te lo mostramos en pantalla; si pierdes el archivo tendrás que
              generar otro y revocar este desde{" "}
              <Link
                href="/api-keys"
                className="text-foreground underline underline-offset-2"
              >
                API Keys
              </Link>
              .
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

      <section className="border-border/60 flex flex-col gap-3 rounded-lg border p-5">
        <h2 className="text-foreground text-base font-medium">
          Cómo funciona el copy
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Cuando das clic en{" "}
          <strong className="text-foreground">Copiar SKILL.md</strong> te
          pedimos un nombre, generamos una API key personal nueva y
          sustituimos los placeholders{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
            {"{{ZB_API_KEY}}"}
          </code>{" "}
          y{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
            {"{{API_BASE_URL}}"}
          </code>{" "}
          dentro del archivo antes de mandarlo al portapapeles. La API key
          queda guardada en{" "}
          <Link
            href="/api-keys"
            className="text-foreground underline underline-offset-2"
          >
            API Keys
          </Link>{" "}
          por si necesitas revocarla luego.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          El dominio que se inyecta es{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
            {baseUrl}
          </code>
          .
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground text-base font-medium">
          Vista previa del SKILL.md
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Esto es lo que vas a pegar (con los placeholders todavía sin
          sustituir).
        </p>
        <CodeBlock language="md" code={SKILL_TEMPLATE} />
      </section>

      <section className="border-border/60 flex flex-col gap-3 rounded-lg border p-5">
        <h2 className="text-foreground flex items-center gap-2 text-base font-medium">
          <Sparkles className="size-4" />
          Instalación
        </h2>
        <ol className="text-muted-foreground flex flex-col gap-2 text-sm leading-relaxed">
          <li>
            <span className="text-foreground font-medium">1.</span> Da clic en{" "}
            <strong className="text-foreground">Copiar SKILL.md</strong> y
            ponle un nombre al token (ej.{" "}
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
              laptop-trabajo
            </code>
            ).
          </li>
          <li>
            <span className="text-foreground font-medium">2.</span> Crea el
            archivo{" "}
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
              ~/.claude/skills/zenboard/SKILL.md
            </code>{" "}
            y pega el contenido.
          </li>
          <li>
            <span className="text-foreground font-medium">3.</span> Reinicia
            Claude Code para que cargue el skill.
          </li>
          <li>
            <span className="text-foreground font-medium">4.</span> Pídele
            cosas tipo &quot;crea una task &apos;Revisar PR&apos; en mi board
            Marketing&quot; o &quot;márcame como hecha la task PR-7&quot;.
          </li>
        </ol>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar token y copiar SKILL.md</DialogTitle>
            <DialogDescription>
              Vamos a crear una API key nueva con este nombre y a inyectarla
              dentro del SKILL.md antes de copiar al portapapeles.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerateAndCopy} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="skill-token-name">
                  Nombre del token
                </FieldLabel>
                <Input
                  id="skill-token-name"
                  autoFocus
                  placeholder="Skill - Claude Code"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  maxLength={100}
                />
                <FieldDescription>
                  Para reconocerlo después en la lista de API Keys.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!tokenName.trim() || generating}
              >
                {generating ? "Generando…" : "Generar y copiar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
