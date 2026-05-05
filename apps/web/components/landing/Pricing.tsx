import Link from "next/link"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Free",
    description: "Para proyectos personales",
    price: "$0",
    billing: "Gratis para siempre",
    features: [
      "3 boards",
      "Tareas ilimitadas",
      "Markdown en descripciones",
      "Acceso a MCP básico",
    ],
    cta: "Comenzar gratis",
    href: "/dashboard",
    featured: false,
  },
  {
    name: "Pro",
    description: "Para equipos pequeños",
    price: "$12",
    billing: "Facturado anualmente",
    features: [
      "Boards ilimitados",
      "Colaboradores ilimitados",
      "MCP con todas las tools",
      "Integraciones premium",
      "Soporte prioritario",
    ],
    cta: "Elegir Pro",
    href: "/dashboard",
    featured: true,
  },
  {
    name: "Team",
    description: "Para empresas",
    price: "$29",
    billing: "Por usuario, facturado anualmente",
    features: [
      "Todo de Pro",
      "SSO / SAML",
      "Auditoría y logs",
      "API dedicada",
      "SLA garantizado",
    ],
    cta: "Contactar ventas",
    href: "#",
    featured: false,
  },
]

export function Pricing() {
  return (
    <section id="precios" className="px-16 py-32">
      <div className="mb-20 flex flex-col items-center gap-4 text-center">
        <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-normal tracking-[-0.02em]">
          Simple y transparente
        </h2>
        <p className="text-muted-foreground mx-auto max-w-[500px] text-[1.1rem]">
          Comienza gratis, escala cuando lo necesites
        </p>
      </div>

      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative transition-all duration-300 hover:-translate-y-1",
              plan.featured && "border-primary shadow-lg"
            )}
          >
            {plan.featured && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Popular
              </Badge>
            )}

            <CardHeader>
              <CardTitle className="text-[1.1rem] font-medium">
                {plan.name}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-serif text-[3rem] font-normal">
                  {plan.price}
                </span>
                <span className="text-muted-foreground text-[1rem]">/ mes</span>
              </div>
              <div className="text-muted-foreground text-[0.85rem]">
                {plan.billing}
              </div>
            </CardHeader>

            <CardContent>
              <ul className="flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="text-muted-foreground flex items-center gap-3 text-[0.9rem]"
                  >
                    <Check className="text-primary size-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                render={<Link href={plan.href} />}
                nativeButton={false}
                variant={plan.featured ? "default" : "outline"}
                size="lg"
                className="w-full"
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
