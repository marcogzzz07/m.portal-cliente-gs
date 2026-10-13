import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  /** Etiqueta junto al título (p. ej. "Centro interno"). */
  badge?: string
  eyebrow?: string
  actions?: React.ReactNode
  className?: string
}

/** Encabezado de página estilo Portal GS: ícono, título, badge y descripción. */
export function PageHeader({ title, description, icon: Icon, badge, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex items-start gap-4">
        {Icon && (
          <span className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <Icon className="size-5" />
          </span>
        )}
        <div className="space-y-1">
          {eyebrow && <p className="text-xs font-semibold tracking-wider text-brand uppercase">{eyebrow}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-tight font-bold tracking-tight text-foreground">{title}</h1>
            {badge && (
              <span className="rounded-full border bg-card px-2.5 py-0.5 text-xs font-semibold text-foreground">
                {badge}
              </span>
            )}
          </div>
          {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
