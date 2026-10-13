import Link from "next/link"
import { BellRing } from "lucide-react"

import { SectionCard } from "@/components/shared/section-card"
import { cn } from "@/lib/utils"

export interface AlertItem {
  id: string
  text: string
  href?: string
  tone?: "warning" | "danger" | "info"
}

const tones = {
  warning: "bg-[oklch(0.965_0.03_65)]",
  danger: "bg-destructive/[0.07]",
  info: "bg-info/[0.07]",
}

/** Alertas breves en recuadros suaves, como en los módulos de Contraloría del Portal GS. */
export function AlertsCard({ items, className }: { items: AlertItem[]; className?: string }) {
  return (
    <SectionCard title="Alertas" icon={BellRing} className={className}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin alertas por ahora.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((a) => {
            const cls = cn("block rounded-xl px-4 py-3 text-sm leading-relaxed", tones[a.tone ?? "warning"], a.href && "transition-opacity hover:opacity-80")
            return (
              <li key={a.id}>
                {a.href ? (
                  <Link href={a.href} className={cls}>
                    {a.text}
                  </Link>
                ) : (
                  <p className={cls}>{a.text}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
