import { CalendarClock } from "lucide-react"

import { StatusBadge } from "@/components/shared/status-badge"
import { daysFromToday, dueLabel, formatDate } from "@/lib/format"
import { actionStatus, priorityMeta } from "@/lib/status"
import type { ActionItem, Priority } from "@/lib/types"
import { cn } from "@/lib/utils"
import { effectiveStatus } from "@/store/portal-store"

export function ActionStatusBadge({ item, className }: { item: ActionItem; className?: string }) {
  return <StatusBadge {...actionStatus[effectiveStatus(item)]} className={className} />
}

/** Fecha límite con texto relativo; en rojo si venció o vence hoy. */
export function DueText({ item, className }: { item: ActionItem; className?: string }) {
  const status = effectiveStatus(item)
  const days = daysFromToday(item.dueDate)
  const done = status === "completed"
  const urgent = !done && item.owner === "cliente" && days <= 1
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", urgent ? "font-semibold text-destructive" : "text-muted-foreground", className)}>
      <CalendarClock className="size-3 shrink-0" aria-hidden />
      {done ? `Completado ${item.completedAt ? formatDate(item.completedAt.slice(0, 10)) : ""}` : item.status === "upcoming" && item.opensOn ? `Se abre el ${formatDate(item.opensOn)}` : `${dueLabel(item.dueDate)} · ${formatDate(item.dueDate)}`}
    </span>
  )
}

const priorityDot: Record<Priority, string> = { alta: "bg-destructive", media: "bg-warning", baja: "bg-muted-foreground/50" }

export function PriorityTag({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className={cn("size-1.5 rounded-full", priorityDot[priority])} aria-hidden />
      {priorityMeta[priority].label}
    </span>
  )
}
