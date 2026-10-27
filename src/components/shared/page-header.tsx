import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  /** Etiqueta junto al título (p. ej. alcance o corte). */
  badge?: string
  /** Contexto breve sobre el título; en minúsculas normales, sin espaciado. */
  eyebrow?: string
  actions?: React.ReactNode
  className?: string
}

/**
 * Encabezado de página con el diseño de `MgPageHeader` del Portal GS: ícono de
 * 40px (gris neutro en el portal de clientes), título de 24px bold, badge con
 * contorno y descripción; acciones a la derecha en escritorio.
 */
export function PageHeader({ title, description, icon: Icon, badge, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-foreground ring-1 ring-border">
            <Icon className="size-[18px]" />
          </span>
        )}
        <div className="space-y-0.5">
          {eyebrow && <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl leading-tight font-bold tracking-tight text-foreground">{title}</h1>
            {badge && <span className="rounded-full border bg-card px-2.5 py-0.5 text-xs font-semibold text-foreground">{badge}</span>}
          </div>
          {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
