import Link from "next/link"
import { Separator } from "@/components/ui/separator"

const links = [
  { label: "Documentación", href: "#", external: false },
  { label: "API", href: "#", external: false },
  { label: "Blog", href: "#", external: false },
  { label: "GitHub", href: "https://github.com", external: true },
  { label: "Twitter", href: "https://twitter.com", external: true },
]

export function Footer() {
  return (
    <footer className="px-16 py-16">
      <Separator className="mb-16" />
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        <div className="font-serif text-[1.5rem] font-normal">
          Zen<span className="text-primary">Board</span>
        </div>

        <div className="flex gap-8">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="text-muted-foreground hover:text-foreground text-[0.9rem] transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="text-muted-foreground text-[0.85rem]">
          © 2025 ZenBoard. Hecho con café y algo de zen.
        </div>
      </div>
    </footer>
  )
}
