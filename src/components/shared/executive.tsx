import type { ReactNode } from "react"
import { AlertTriangle, Lightbulb } from "lucide-react"

import { cn } from "@/lib/utils"

// Kit ejecutivo del Portal GS (src/components/ui/Executive.tsx): piezas que van
// dentro de `SectionCard`. Clases `gs-exec-*` en src/styles/gs-theme.css.

export type StatStripItem = { label: string; value: ReactNode }

/** Métricas hermanas al pie de una tarjeta, separadas por divisores (va en `footer`). */
export function StatStrip({ items }: { items: StatStripItem[] }) {
  return (
    <dl className="gs-exec-stat-strip">
      {items.map((item) => (
        <div key={item.label} className="gs-exec-stat">
          <dt className="gs-exec-stat-label">{item.label}</dt>
          <dd className="gs-exec-stat-value">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export type MeterTone = "success" | "warning" | "danger" | "neutral"

const METER_COLORS: Record<MeterTone, string> = {
  success: "text-[color:var(--gs-color-success-base)]",
  warning: "text-[color:var(--gs-color-warning-base)]",
  danger: "text-[color:var(--gs-color-danger-base)]",
  neutral: "text-[color:var(--gs-chart-1)]",
}

/** Semáforo de avance: en orden desde 90 %, atención desde 70 %, rezago debajo. El texto siempre acompaña al color. */
export function toneForCompletion(ratio: number): MeterTone {
  if (ratio >= 0.9) return "success"
  if (ratio >= 0.7) return "warning"
  return "danger"
}

/** Barra de avance de 0 a 1 (pill de 6px). */
export function Meter({ value, tone = "neutral", className }: { value: number; tone?: MeterTone; className?: string }) {
  const width = Math.min(Math.max(value, 0), 1) * 100
  return (
    <div className={cn("gs-exec-meter", METER_COLORS[tone], className)} aria-hidden="true">
      <span style={{ width: `${width}%` }} />
    </div>
  )
}

export type InsightRow = { label: string; text: ReactNode; value?: ReactNode }

/** Resumen ejecutivo: filas `categoría · lectura · cifra` separadas por divisores. */
export function InsightList({ rows }: { rows: InsightRow[] }) {
  return (
    <ul className="gs-exec-insight-list">
      {rows.map((row) => (
        <li key={row.label} className="gs-exec-insight-row">
          <span className="text-sm text-muted-foreground">{row.label}</span>
          <span className="min-w-0 truncate text-sm font-medium">{row.text}</span>
          {row.value ? <span className="justify-self-end">{row.value}</span> : null}
        </li>
      ))}
    </ul>
  )
}

/** Recuadro con una sola lectura accionable; `alert` usa el tono de peligro. */
export function Callout({ tone = "default", children, className }: { tone?: "default" | "alert"; children: ReactNode; className?: string }) {
  const Icon = tone === "alert" ? AlertTriangle : Lightbulb
  return (
    <div className={cn("gs-exec-callout", className)} data-tone={tone}>
      <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", tone === "default" && "text-muted-foreground")} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Banda gris que rotula una lista dentro de una tarjeta. */
export function ListHeading({ children }: { children: ReactNode }) {
  return <p className="gs-exec-list-heading">{children}</p>
}
