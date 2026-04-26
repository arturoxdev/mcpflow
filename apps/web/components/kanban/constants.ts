import { Status } from "@repo/core"

export const COLUMNS: { id: Status; title: string; dotClass: string }[] = [
  { id: "todo", title: "To Do", dotClass: "bg-destructive" },
  { id: "doing", title: "Doing", dotClass: "bg-chart-3" },
  { id: "done", title: "Done", dotClass: "bg-chart-4" },
]
