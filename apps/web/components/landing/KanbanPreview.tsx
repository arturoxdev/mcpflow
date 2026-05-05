import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Priority = "low" | "medium" | "high"

interface PreviewTask {
  title: string
  description: string
  priority: Priority
}

interface PreviewColumn {
  title: string
  dotClass: string
  tasks: PreviewTask[]
}

const PREVIEW_DATA: PreviewColumn[] = [
  {
    title: "Todo",
    dotClass: "bg-destructive",
    tasks: [
      {
        title: "Diseñar nueva landing",
        description: "Crear wireframes y mockups para la página principal",
        priority: "high",
      },
      {
        title: "Configurar CI/CD",
        description: "Pipeline de deploy automático",
        priority: "medium",
      },
    ],
  },
  {
    title: "Haciendo",
    dotClass: "bg-chart-3",
    tasks: [
      {
        title: "Implementar auth con OAuth",
        description: "Integrar Google y GitHub como providers",
        priority: "high",
      },
    ],
  },
  {
    title: "Done",
    dotClass: "bg-chart-4",
    tasks: [
      {
        title: "Setup inicial del proyecto",
        description: "Next.js + TypeScript + Tailwind",
        priority: "low",
      },
      {
        title: "Definir estructura de DB",
        description: "Esquema para boards y tasks",
        priority: "medium",
      },
    ],
  },
]

const priorityLabel: Record<Priority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
}

const priorityVariant: Record<
  Priority,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  high: "destructive",
  medium: "outline",
  low: "secondary",
}

export function KanbanPreview() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PREVIEW_DATA.map((column) => (
        <div
          key={column.title}
          className="border-border bg-background rounded-xl border p-4"
        >
          <div className="border-border mb-4 flex items-center gap-2 border-b pb-3">
            <div className={cn("size-2 rounded-full", column.dotClass)} />
            <span className="text-muted-foreground text-[0.7rem] font-semibold tracking-[0.1em] uppercase">
              {column.title}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {column.tasks.map((task) => (
              <Card
                key={task.title}
                className="hover:border-ring transition-all duration-200 hover:-translate-y-0.5"
              >
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="text-foreground text-[0.85rem] font-medium">
                    {task.title}
                  </div>
                  <div className="text-muted-foreground text-[0.75rem] leading-[1.5]">
                    {task.description}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={priorityVariant[task.priority]}
                      className="text-[0.65rem] uppercase"
                    >
                      {priorityLabel[task.priority]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
