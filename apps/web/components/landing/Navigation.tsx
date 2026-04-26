import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navigation() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-[100] mx-auto flex w-4/5 items-center justify-between bg-gradient-to-b from-background to-transparent px-16 py-6 backdrop-blur-[10px]">
      <div className="font-serif text-[1.75rem] font-bold italic tracking-[-0.02em]">
        MCP<span className="text-primary italic">Flow</span>
      </div>

      <div className="flex items-center gap-10">
        <Link
          href="#features"
          className="text-muted-foreground hover:text-foreground text-[0.9rem] transition-colors duration-200"
        >
          Características
        </Link>
        <Link
          href="#integracion"
          className="text-muted-foreground hover:text-foreground text-[0.9rem] transition-colors duration-200"
        >
          Integración
        </Link>
        <Link
          href="#precios"
          className="text-muted-foreground hover:text-foreground text-[0.9rem] transition-colors duration-200"
        >
          Precios
        </Link>
        <Button render={<Link href="/boards" />} nativeButton={false} size="lg">
          Comenzar gratis
        </Button>
      </div>
    </nav>
  )
}
