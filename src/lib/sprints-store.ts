type Listener = () => void

const listeners = new Set<Listener>()

export const sprintsStore = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
  notify(): void {
    listeners.forEach((fn) => fn())
  },
}
