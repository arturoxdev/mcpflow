export type BreadcrumbItem = { label: string; href?: string }

let items: BreadcrumbItem[] = []
const listeners = new Set<() => void>()

export const breadcrumbStore = {
  get(): BreadcrumbItem[] {
    return items
  },
  set(next: BreadcrumbItem[]): void {
    items = next
    listeners.forEach((fn) => fn())
  },
  subscribe(fn: () => void): () => void {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}
