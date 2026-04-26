"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { Check, ClipboardCopy } from "lucide-react"

import {
  EndpointSection,
  type HttpMethod,
} from "@/components/api-docs/endpoint-section"
import { CodeBlock } from "@/components/api-docs/code-block"
import { Button } from "@/components/ui/button"
import { useBreadcrumb } from "@/hooks/use-breadcrumb"

const SSR_PLACEHOLDER = "https://your-app.example"

const subscribe = () => () => {}
const getSnapshot = () => window.location.origin
const getServerSnapshot = () => SSR_PLACEHOLDER

const SAMPLE_BOARD_ID = "01J9YXZ8K9P3TQ4M5R6N7B8A9C"
const SAMPLE_TASK_ID = "01J9YXZBR3D7E8F9G0H1J2K3L4"
const SAMPLE_USER_ID = "user_2pAbcDeFgHiJkLmNoPqR"

type Endpoint = {
  method: HttpMethod
  path: string
  title: string
  description: string
  curl: (base: string) => string
  exampleResponse: string
  requestBody?: string
}

const SAMPLE_BOARD = {
  id: SAMPLE_BOARD_ID,
  userId: SAMPLE_USER_ID,
  name: "Marketing Q2",
  description: "Initiatives for the second quarter",
  createdAt: "2026-04-25T14:32:11.000Z",
}

const SAMPLE_TASK = {
  id: SAMPLE_TASK_ID,
  userId: SAMPLE_USER_ID,
  title: "Write launch announcement",
  description: "Draft the blog post and social copy",
  priority: "high",
  status: "doing",
  boardId: SAMPLE_BOARD_ID,
  pr: 7,
}

const BOARD_MODEL = `{
  id: string         // ULID
  userId: string     // Clerk user id
  name: string
  description: string
  createdAt: string  // ISO 8601
}`

const TASK_MODEL = `{
  id: string                              // ULID
  userId: string                          // Clerk user id
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'doing' | 'done'
  boardId: string
  pr: number                              // numero correlativo dentro del board
}`

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/boards",
    title: "Listar todos los boards del usuario",
    description:
      "Devuelve un arreglo con todos los boards del usuario autenticado.",
    curl: (base) =>
      `curl -X GET "${base}/api/boards" \\\n  -H "Authorization: Bearer $YOUR_API_KEY"`,
    exampleResponse: JSON.stringify([SAMPLE_BOARD], null, 2),
  },
  {
    method: "GET",
    path: "/api/boards/{boardId}",
    title: "Obtener un board por id",
    description: "Devuelve un solo board. Responde 404 si el id no existe.",
    curl: (base) =>
      `curl -X GET "${base}/api/boards/${SAMPLE_BOARD_ID}" \\\n  -H "Authorization: Bearer $YOUR_API_KEY"`,
    exampleResponse: JSON.stringify(SAMPLE_BOARD, null, 2),
  },
  {
    method: "GET",
    path: "/api/boards/{boardId}/tasks",
    title: "Listar las tasks de un board",
    description: "Devuelve todas las tasks que pertenecen al board indicado.",
    curl: (base) =>
      `curl -X GET "${base}/api/boards/${SAMPLE_BOARD_ID}/tasks" \\\n  -H "Authorization: Bearer $YOUR_API_KEY"`,
    exampleResponse: JSON.stringify([SAMPLE_TASK], null, 2),
  },
  {
    method: "GET",
    path: "/api/boards/{boardId}/tasks/{taskId}",
    title: "Obtener una task por id",
    description:
      "Devuelve una sola task perteneciente al board. Responde 404 si no existe.",
    curl: (base) =>
      `curl -X GET "${base}/api/boards/${SAMPLE_BOARD_ID}/tasks/${SAMPLE_TASK_ID}" \\\n  -H "Authorization: Bearer $YOUR_API_KEY"`,
    exampleResponse: JSON.stringify(SAMPLE_TASK, null, 2),
  },
  {
    method: "POST",
    path: "/api/boards/{boardId}/tasks",
    title: "Crear una task",
    description:
      "Crea una task dentro del board indicado. Solo `title` es obligatorio. `priority` por defecto es `medium`, `status` por defecto es `todo`. Responde 201 con la task creada.",
    requestBody: JSON.stringify(
      {
        title: "Write launch announcement",
        description: "Draft the blog post and social copy",
        priority: "high",
        status: "doing",
      },
      null,
      2
    ),
    curl: (base) =>
      `curl -X POST "${base}/api/boards/${SAMPLE_BOARD_ID}/tasks" \\\n  -H "Authorization: Bearer $YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "title": "Write launch announcement",\n    "description": "Draft the blog post and social copy",\n    "priority": "high",\n    "status": "doing"\n  }'`,
    exampleResponse: JSON.stringify(SAMPLE_TASK, null, 2),
  },
  {
    method: "PATCH",
    path: "/api/boards/{boardId}/tasks/{taskId}",
    title: "Actualizar una task",
    description:
      "Actualiza parcialmente una task. Todos los campos del body son opcionales; solo se modifican los que envíes. Devuelve la task con los cambios aplicados.",
    requestBody: JSON.stringify(
      {
        status: "done",
        priority: "low",
      },
      null,
      2
    ),
    curl: (base) =>
      `curl -X PATCH "${base}/api/boards/${SAMPLE_BOARD_ID}/tasks/${SAMPLE_TASK_ID}" \\\n  -H "Authorization: Bearer $YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "status": "done",\n    "priority": "low"\n  }'`,
    exampleResponse: JSON.stringify(
      { ...SAMPLE_TASK, status: "done", priority: "low" },
      null,
      2
    ),
  },
  {
    method: "DELETE",
    path: "/api/boards/{boardId}/tasks/{taskId}",
    title: "Eliminar una task",
    description:
      "Elimina la task indicada del board. Responde con un objeto de éxito.",
    curl: (base) =>
      `curl -X DELETE "${base}/api/boards/${SAMPLE_BOARD_ID}/tasks/${SAMPLE_TASK_ID}" \\\n  -H "Authorization: Bearer $YOUR_API_KEY"`,
    exampleResponse: JSON.stringify({ success: true }, null, 2),
  },
]

function buildFullDocsMarkdown(baseUrl: string): string {
  const parts: string[] = []
  parts.push(`# ZenBoard API\n`)
  parts.push(
    `API HTTP para gestionar boards y tasks. Pensada para ser consumida desde un Skill o agente IA.\n`
  )
  parts.push(`Base URL: \`${baseUrl}\`\n`)
  parts.push(`## Autenticación\n`)
  parts.push(
    `Todos los endpoints requieren un API token personal en el header \`Authorization: Bearer <token>\`. Genera uno en \`${baseUrl}/api-keys\`. El token tiene formato \`zb_pat_<...>\` y solo se muestra una vez al crearlo. Si lo pierdes, genera otro y revoca el anterior.\n`
  )
  parts.push(`Sin token o token inválido → \`401 No autorizado\`.\n`)
  parts.push(`## Modelos\n`)
  parts.push(`### Board\n\n\`\`\`ts\n${BOARD_MODEL}\n\`\`\`\n`)
  parts.push(`### Task\n\n\`\`\`ts\n${TASK_MODEL}\n\`\`\`\n`)
  parts.push(`## Endpoints\n`)
  for (const e of ENDPOINTS) {
    parts.push(`### ${e.method} ${e.path}\n`)
    parts.push(`${e.title}\n`)
    parts.push(`${e.description}\n`)
    if (e.requestBody) {
      parts.push(`Request body:\n\n\`\`\`json\n${e.requestBody}\n\`\`\`\n`)
    }
    parts.push(`Curl:\n\n\`\`\`bash\n${e.curl(baseUrl)}\n\`\`\`\n`)
    parts.push(`Respuesta:\n\n\`\`\`json\n${e.exampleResponse}\n\`\`\`\n`)
  }
  return parts.join("\n")
}

export default function ApiDocsPage() {
  useBreadcrumb([{ label: "API Docs" }])
  const baseUrl = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  const [copiedAll, setCopiedAll] = useState(false)

  const handleCopyAll = async () => {
    try {
      const md = buildFullDocsMarkdown(baseUrl)
      await navigator.clipboard.writeText(md)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 1800)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex h-full flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-4xl font-bold italic">API Docs</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Endpoints HTTP que un agente de IA o un Skill puede consumir para
            gestionar boards y tasks. Cada bloque trae un curl copiable y un
            ejemplo de la respuesta.
          </p>
        </div>
        <Button onClick={handleCopyAll} variant="outline">
          {copiedAll ? <Check /> : <ClipboardCopy />}
          {copiedAll ? "Copiado" : "Copiar documentación completa"}
        </Button>
      </header>

      <section className="border-border/60 flex flex-col gap-3 rounded-lg border p-5">
        <h2 className="text-foreground text-base font-medium">
          Autenticación
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Todos los endpoints requieren un API token personal en el header{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
            Authorization: Bearer &lt;token&gt;
          </code>
          . Genera el tuyo en{" "}
          <Link
            href="/api-keys"
            className="text-foreground underline underline-offset-2"
          >
            API Keys
          </Link>
          . El token tiene formato{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
            zb_pat_…
          </code>{" "}
          y solo se muestra una vez al crearlo. Si lo pierdes, genera otro y
          revoca el anterior.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          En los ejemplos sustituye{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
            $YOUR_API_KEY
          </code>{" "}
          por tu token. Sin token o token inválido la respuesta es{" "}
          <strong>401 No autorizado</strong>.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground text-base font-medium">Modelos</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Board
            </span>
            <CodeBlock language="ts" code={BOARD_MODEL} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Task
            </span>
            <CodeBlock language="ts" code={TASK_MODEL} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-foreground text-base font-medium">Endpoints</h2>
        <div className="flex flex-col gap-4">
          {ENDPOINTS.map((e) => (
            <EndpointSection
              key={`${e.method} ${e.path}`}
              method={e.method}
              path={e.path}
              title={e.title}
              description={e.description}
              curl={e.curl(baseUrl)}
              exampleResponse={e.exampleResponse}
              requestBody={e.requestBody}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
