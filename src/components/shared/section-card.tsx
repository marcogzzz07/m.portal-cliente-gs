import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: string
  description?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
  children: React.ReactNode
  /** Pegado al borde inferior (p. ej. una franja de métricas `StatStrip`). */
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
  /** El contenido llega a los bordes de la tarjeta (tablas y listas). */
  flush?: boolean
}

/**
 * Tarjeta con el diseño de `MgSectionCard` del Portal GS: blanca sobre el canvas
 * gris, radio de 8px y frontera sutil sin sombra; título de 16px con ícono en
 * cuadro gris, descripción de 12px y acción a la derecha.
 */
export function SectionCard({ title, description, icon: Icon, action, children, footer, className, contentClassName, flush = false }: SectionCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-[var(--gs-radius-lg)] border bg-card pt-3.5 text-sm text-card-foreground",
        footer || flush ? "overflow-hidden" : "pb-3.5",
        flush && !footer && "pb-0",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4">
        <div className="min-w-0 space-y-0.5">
          <h2 className="flex items-center gap-2 text-base leading-snug font-medium">
            {Icon && (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon className="size-4" />
              </span>
            )}
            {title}
          </h2>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("flex-1", flush ? "px-0" : "px-4", contentClassName)}>{children}</div>
      {footer}
    </section>
  )
}
