import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  /** El contenido llega a los bordes de la tarjeta (tablas y listas). */
  flush?: boolean
}

/** Tarjeta base para widgets: título, descripción opcional y acción. */
export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
  flush = false,
}: SectionCardProps) {
  return (
    <Card className={cn("gap-4 rounded-2xl [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]", flush && "pb-0", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-[17px]">
          {Icon && (
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
              <Icon className="size-4" />
            </span>
          )}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={cn("flex-1", flush && "px-0", contentClassName)}>{children}</CardContent>
    </Card>
  )
}
