export type PageActionItem = {
  label: string
  href: string
  variant?: "default" | "outline"
}

export type PageActions = {
  primary?: PageActionItem
  secondary?: PageActionItem
  hideDefaults?: boolean
} | null

let actions: PageActions = null
const listeners = new Set<() => void>()

export const pageActionsStore = {
  get(): PageActions {
    return actions
  },
  set(next: PageActions): void {
    actions = next
    listeners.forEach((fn) => fn())
  },
  subscribe(fn: () => void): () => void {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}
