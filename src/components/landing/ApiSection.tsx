import { Check } from "lucide-react"

const bullets = [
  "Crear tareas con un POST a /api/tasks",
  "Mover tareas entre columnas",
  "Listar y consultar el estado del board",
  "Eliminar tareas completadas",
  "Funciona con Cursor, Claude Code, scripts o cualquier cliente HTTP",
]

export function ApiSection() {
  return (
    <section id="integracion" className="bg-muted relative px-16 py-32">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-24 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-normal tracking-[-0.02em]">
            API REST para <em className="text-primary italic">agentes</em>{" "}
            cuando lo necesites
          </h2>

          <p className="text-muted-foreground text-[1.1rem] leading-[1.7]">
            ZenBoard expone una API REST autenticada con personal access
            tokens. Generá tu token en{" "}
            <a href="/api-keys" className="text-primary underline">
              /api-keys
            </a>{" "}
            y consultá la documentación completa en{" "}
            <a href="/api-docs" className="text-primary underline">
              /api-docs
            </a>
            .
          </p>

          <ul className="flex flex-col gap-4">
            {bullets.map((b) => (
              <li
                key={b}
                className="text-muted-foreground flex items-center gap-3 text-[0.95rem]"
              >
                <Check className="text-primary size-4 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-border bg-background overflow-hidden rounded-xl border">
          <div className="border-border bg-card flex items-center gap-2 border-b px-6 py-4">
            <span className="text-muted-foreground font-mono text-[0.8rem]">
              terminal
            </span>
          </div>

          <div className="overflow-x-auto p-6">
            <pre className="text-muted-foreground font-mono text-[0.85rem] leading-[1.8]">
              <code>
                <span className="text-muted-foreground">
                  # Listar boards con tu personal access token
                </span>
                {"\n"}
                <span className="text-primary">$</span> curl -H{" "}
                <span className="text-chart-4">
                  &quot;Authorization: Bearer zb_pat_...&quot;
                </span>
                {"\n  "}
                https://zenboard.app/api/boards
                {"\n\n"}
                <span className="text-chart-4">[</span>
                {"\n"}
                {"  "}
                <span className="text-chart-4">
                  {"{"} &quot;id&quot;: &quot;abc123&quot;, &quot;name&quot;:
                  &quot;Mi Proyecto&quot; {"}"},
                </span>
                {"\n"}
                {"  "}
                <span className="text-chart-4">
                  {"{"} &quot;id&quot;: &quot;xyz789&quot;, &quot;name&quot;:
                  &quot;App Mobile&quot; {"}"}
                </span>
                {"\n"}
                <span className="text-chart-4">]</span>
                {"\n\n"}
                <span className="text-muted-foreground">
                  # Crear una tarea
                </span>
                {"\n"}
                <span className="text-primary">$</span> curl -X POST -H{" "}
                <span className="text-chart-4">
                  &quot;Authorization: Bearer zb_pat_...&quot;
                </span>
                {"\n  "}
                -d{" "}
                <span className="text-chart-4">
                  &apos;{"{"}&quot;title&quot;:&quot;Implementar
                  auth&quot;,&quot;priority&quot;:&quot;high&quot;{"}"}&apos;
                </span>
                {"\n  "}
                https://zenboard.app/api/boards/abc123/tasks
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
