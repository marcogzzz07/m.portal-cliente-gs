import type { StatusMeta, StatusTone } from "@/lib/status"
import { cn } from "@/lib/utils"

/** Tonos semánticos de los tokens GS (como `MgBadge` y `StatusBadge` del Portal GS). */
const toneClasses: Record<StatusTone, string> = {
  success: "bg-[var(--gs-color-success-subtle)] text-[var(--gs-color-success-foreground)]",
  warning: "bg-[var(--gs-color-warning-subtle)] text-[var(--gs-color-warning-foreground)]",
  danger: "bg-[var(--gs-color-danger-subtle)] text-[var(--gs-color-danger-foreground)]",
  info: "bg-[var(--gs-color-info-subtle)] text-[var(--gs-color-info-foreground)]",
  neutral: "bg-muted text-[var(--gs-color-text-secondary)]",
  brand: "bg-brand-soft text-brand",
}

interface StatusBadgeProps extends StatusMeta {
  className?: string
  /** Punto de color. Desactivado por defecto: la palabra y el tono ya comunican el estado. */
  dot?: boolean
}

export function StatusBadge({ label, tone, dot = false, className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", toneClasses[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {label}
    </span>
  )
}
