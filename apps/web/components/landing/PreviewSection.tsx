import { KanbanPreview } from "./KanbanPreview"

export function PreviewSection() {
  return (
    <section id="preview" className="relative px-16 pt-8 pb-32">
      <div
        className="border-border bg-card mx-auto max-w-[1200px] overflow-hidden rounded-2xl border shadow-xl"
        style={{
          animation: "floatUp 1s ease 0.5s forwards",
          opacity: 0,
          transform: "translateY(40px)",
        }}
      >
        <div className="border-border flex items-center gap-2 border-b px-6 py-4">
          <div className="size-3 rounded-full bg-[#ff5f57]" />
          <div className="size-3 rounded-full bg-[#ffbd2e]" />
          <div className="size-3 rounded-full bg-[#28c840]" />
          <span className="text-muted-foreground ml-4 text-[0.85rem]">
            ZenBoard — Mi Proyecto
          </span>
        </div>

        <div className="p-6">
          <KanbanPreview />
        </div>
      </div>
    </section>
  )
}
