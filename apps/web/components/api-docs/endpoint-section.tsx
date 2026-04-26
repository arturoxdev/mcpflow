import { CodeBlock } from "./code-block"
import { cn } from "@/lib/utils"

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT"

type EndpointSectionProps = {
  method: HttpMethod
  path: string
  title: string
  description: string
  curl: string
  exampleResponse: string
  requestBody?: string
}

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  POST: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  PATCH: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  PUT: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  DELETE: "bg-destructive/15 text-destructive border-destructive/30",
}

export function EndpointSection({
  method,
  path,
  title,
  description,
  curl,
  exampleResponse,
  requestBody,
}: EndpointSectionProps) {
  return (
    <section className="border-border/60 flex flex-col gap-4 rounded-lg border p-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide uppercase",
              METHOD_STYLES[method]
            )}
          >
            {method}
          </span>
          <code className="text-foreground font-mono text-sm">{path}</code>
        </div>
        <h3 className="text-foreground text-base font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </header>

      {requestBody && (
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Request body
          </span>
          <CodeBlock code={requestBody} language="json" />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          curl
        </span>
        <CodeBlock code={curl} language="bash" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Respuesta de ejemplo
        </span>
        <CodeBlock code={exampleResponse} language="json" />
      </div>
    </section>
  )
}
