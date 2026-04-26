import { Check } from "lucide-react"

const bullets = [
  "Crear tareas con lenguaje natural",
  "Mover tareas entre columnas",
  "Listar y consultar el estado del board",
  "Eliminar tareas completadas",
  "Compatible con OpenCode, Claude y más",
]

export function MCPSection() {
  return (
    <section id="integracion" className="bg-muted relative px-16 py-32">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-24 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-normal tracking-[-0.02em]">
            Controlado por <em className="text-primary italic">IA</em> cuando lo
            necesites
          </h2>

          <p className="text-muted-foreground text-[1.1rem] leading-[1.7]">
            ZenBoard incluye un servidor MCP (Model Context Protocol) que
            permite a agentes de IA como Claude o tu propio asistente gestionar
            tareas por ti.
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
                  # Desde tu agente de IA favorito
                </span>
                {"\n\n"}
                <span className="text-primary">{">"}</span> Lista mis boards
                {"\n\n"}
                <span className="text-chart-4">📋 Boards:</span>
                {"\n"}
                <span className="text-chart-4">- Mi Proyecto (abc123)</span>
                {"\n"}
                <span className="text-chart-4">- App Mobile (xyz789)</span>
                {"\n\n"}
                <span className="text-primary">{">"}</span> Crea una tarea
                &quot;Implementar auth&quot;{"\n"}
                {"   "}con prioridad alta en abc123
                {"\n\n"}
                <span className="text-chart-4">
                  ✅ Tarea creada: &quot;Implementar auth&quot;
                </span>
                {"\n\n"}
                <span className="text-primary">{">"}</span> Mueve la tarea a
                doing
                {"\n\n"}
                <span className="text-chart-4">
                  ✅ Tarea movida a &quot;doing&quot;
                </span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
