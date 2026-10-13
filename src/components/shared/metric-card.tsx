import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const accents = {
  green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  pink: "bg-rose-50 text-rose-600 ring-rose-100",
}

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  helper?: string
  icon: LucideIcon
  accent?: keyof typeof accents
  /** 0–100: muestra una barra de progreso bajo el valor. */
  progress?: number
  href?: string
  /** Resalta la tarjeta (p. ej. cuando actúa como filtro activo). */
  selected?: boolean
  /** Pie de la tarjeta (p. ej. alcance, periodo y fuente de la cifra). */
  footer?: React.ReactNode
}

export function MetricCard({ label, value, unit, helper, icon: Icon, accent = "blue", progress, href, selected, footer }: MetricCardProps) {
  const content = (
    <Card
      className={cn(
        "h-full gap-3 px-5 py-5 shadow-none transition-shadow",
        href && "hover:shadow-md",
        selected && "ring-2 ring-brand"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg ring-1", accents[accent])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </p>
      {progress !== undefined && <Progress value={progress} className="h-1.5" />}
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      {footer && <div className="mt-auto border-t pt-2.5">{footer}</div>}
    </Card>
  )

  return href ? (
    <Link href={href} className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      {content}
    </Link>
  ) : (
    content
  )
}
