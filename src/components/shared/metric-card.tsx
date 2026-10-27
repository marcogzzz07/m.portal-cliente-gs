import Link from "next/link"
import { ArrowUpRight, type LucideIcon } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

/**
 * Se conserva la prop por compatibilidad con las pantallas, pero el ícono va en
 * gris neutro: en el portal de clientes el color queda solo para estados
 * (decisión de Marco, 27 oct 2026).
 */
type Accent = "green" | "blue" | "amber" | "pink"

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  helper?: string
  icon: LucideIcon
  accent?: Accent
  /** 0–100: muestra una barra de progreso bajo el valor. */
  progress?: number
  /** Variación (p. ej. `ChartDelta`) antes del texto de ayuda. */
  trend?: React.ReactNode
  href?: string
  /** Resalta la tarjeta (p. ej. cuando actúa como filtro activo). */
  selected?: boolean
  /** Pie de la tarjeta (p. ej. alcance, periodo y fuente de la cifra). */
  footer?: React.ReactNode
}

/**
 * Indicador con el diseño de `MgMetricCard` del Portal GS: etiqueta de 14px,
 * ícono de 28px en cuadro, cifra de 26px bold tabular y pie alineado al fondo.
 * Con `href` toda la tarjeta es un enlace: sombra suave y flecha al pasar el cursor.
 */
export function MetricCard({ label, value, unit, helper, icon: Icon, progress, trend, href, selected, footer }: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "flex h-full flex-col gap-1.5 rounded-[var(--gs-radius-lg)] border bg-card px-4 py-3 text-sm text-card-foreground",
        href && "transition-shadow group-hover:shadow-[0_4px_14px_rgba(24,25,27,0.10)]",
        selected && "border-brand ring-1 ring-brand"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          {label}
          {href && <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />}
        </p>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border">
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="text-[1.625rem] leading-tight font-bold tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </p>
      {progress !== undefined && <Progress value={progress} className="h-1.5" />}
      {(trend || helper) && (
        // mt-auto: el pie queda en la misma línea en todas las tarjetas de la fila.
        <div className="mt-auto flex min-w-0 items-center gap-2">
          {trend}
          {helper && <p className="truncate text-xs text-muted-foreground">{helper}</p>}
        </div>
      )}
      {footer && <div className={cn("border-t pt-2", !(trend || helper) && "mt-auto")}>{footer}</div>}
    </div>
  )

  return href ? (
    <Link href={href} className="group gs-focusable block h-full rounded-[var(--gs-radius-lg)]">
      {content}
    </Link>
  ) : (
    content
  )
}
