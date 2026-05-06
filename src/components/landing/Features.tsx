import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const features = [
  {
    icon: "📋",
    title: "Múltiples Boards",
    description:
      "Organiza diferentes proyectos en boards separados. Cada uno con su propio flujo y contexto.",
  },
  {
    icon: "🎯",
    title: "Prioridades Claras",
    description:
      "Sistema de prioridades visual para identificar rápidamente qué necesita atención inmediata.",
  },
  {
    icon: "✨",
    title: "Drag & Drop",
    description:
      "Mueve tareas entre columnas con fluidez. La interfaz responde a tu ritmo de trabajo.",
  },
  {
    icon: "📝",
    title: "Markdown Nativo",
    description:
      "Descripciones ricas con formato. Documenta contexto, checklists y referencias.",
  },
  {
    icon: "🤖",
    title: "MCP Integrado",
    description:
      "Conecta agentes de IA para automatizar la gestión de tareas desde tu terminal.",
  },
  {
    icon: "🌙",
    title: "Dark Mode First",
    description:
      "Diseñado para sesiones largas. Cuida tus ojos mientras mantienes el flow.",
  },
]

export function Features() {
  return (
    <section id="features" className="relative px-16 py-32">
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(46, 103, 255, 0.04) 0%, transparent 70%)",
        }}
      />

      <div className="mb-20 flex flex-col items-center gap-4 text-center">
        <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-normal tracking-[-0.02em]">
          Todo lo que necesitas, nada que no
        </h2>
        <p className="text-muted-foreground mx-auto max-w-[500px] text-[1.1rem]">
          Simplicidad intencional para mantener el foco en lo que importa
        </p>
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group hover:border-ring relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
          >
            <CardHeader>
              <div className="bg-accent text-accent-foreground mb-2 flex size-12 items-center justify-center rounded-xl text-2xl">
                {feature.icon}
              </div>
              <CardTitle className="text-[1.25rem]">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-[0.95rem] leading-[1.6]">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
