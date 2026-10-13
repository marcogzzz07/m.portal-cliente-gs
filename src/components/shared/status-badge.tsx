import { Badge } from "@/components/ui/badge"
import type { StatusMeta, StatusTone } from "@/lib/status"
import { cn } from "@/lib/utils"

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-[color-mix(in_oklch,var(--warning),black_30%)]",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/12 text-info",
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-brand-soft text-brand",
}

interface StatusBadgeProps extends StatusMeta {
  className?: string
  dot?: boolean
}

export function StatusBadge({ label, tone, dot = true, className }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5 font-medium", toneClasses[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {label}
    </Badge>
  )
}
