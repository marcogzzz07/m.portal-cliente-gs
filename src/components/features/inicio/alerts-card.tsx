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

// Tonos semánticos de los tokens GS; la palabra de cada alerta nombra el problema.
const tones = {
  warning: "bg-[var(--gs-color-warning-subtle)] text-[var(--gs-color-warning-foreground)]",
  danger: "bg-[var(--gs-color-danger-subtle)] text-[var(--gs-color-danger-foreground)]",
  info: "bg-[var(--gs-color-info-subtle)] text-[var(--gs-color-info-foreground)]",
}

/** Alertas breves en recuadros de radio de control (como `Callout` del Portal GS). */
export function AlertsCard({ items, className }: { items: AlertItem[]; className?: string }) {
  return (
    <SectionCard title="Alertas" icon={BellRing} className={className}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin alertas por ahora.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => {
            const cls = cn("gs-focusable block rounded-[var(--gs-radius-md)] px-3 py-2 text-[13px] leading-relaxed", tones[a.tone ?? "warning"], a.href && "underline-offset-2 hover:underline")
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
