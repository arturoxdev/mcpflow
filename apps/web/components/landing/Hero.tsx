import Link from "next/link"
import { BrandMark } from "@/components/brand-mark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-8 pt-32 pb-16 text-center">
      <div
        className="pointer-events-none absolute top-[10%] left-[10%] h-[600px] w-[600px] blur-[60px]"
        style={{
          background:
            "radial-gradient(circle, rgba(46, 103, 255, 0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute right-[5%] bottom-[20%] h-[500px] w-[500px] blur-[60px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 108, 53, 0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div
          className="flex justify-center"
          style={{ animation: "fadeInUp 0.8s ease forwards", opacity: 0 }}
        >
          <BrandMark className="size-20" />
        </div>
        <Badge
          variant="outline"
          className="animate-[fadeInUp_0.8s_ease_forwards] gap-2 rounded-full px-4 py-2"
        >
          <span className="bg-chart-4 inline-block size-1.5 animate-[pulse_2s_infinite] rounded-full" />
          <span className="text-muted-foreground text-[0.8rem]">
            Nuevo: Integración con MCP para agentes de IA
          </span>
        </Badge>

        <h1
          className="max-w-[900px] font-serif text-[clamp(3rem,8vw,6rem)] leading-[1.05] font-normal tracking-[-0.03em]"
          style={{
            animation: "fadeInUp 0.8s ease 0.1s forwards",
            opacity: 0,
          }}
        >
          Gestiona tus proyectos con{" "}
          <em className="text-primary italic">claridad zen</em>
        </h1>

        <p
          className="text-muted-foreground mx-auto max-w-[600px] text-[1.25rem]"
          style={{
            animation: "fadeInUp 0.8s ease 0.2s forwards",
            opacity: 0,
          }}
        >
          Un tablero Kanban minimalista y potente. Organiza tareas, colabora con
          tu equipo y deja que la IA te ayude a mantener el flujo.
        </p>

        <div
          className="flex justify-center gap-4"
          style={{
            animation: "fadeInUp 0.8s ease 0.3s forwards",
            opacity: 0,
          }}
        >
          <Button render={<Link href="/boards" />} nativeButton={false} size="lg">
            Crear mi primer board
          </Button>
          <Button
            render={<Link href="#preview" />}
            nativeButton={false}
            variant="outline"
            size="lg"
          >
            Ver demo
          </Button>
        </div>
      </div>
    </section>
  )
}
