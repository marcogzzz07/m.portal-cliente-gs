"use client"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CompanyTag } from "@/components/shared/company-tag"
import { UserAvatar } from "@/components/shared/user-avatar"
import { getPerson, serviceNames } from "@/data/organization"
import { actionKindMeta } from "@/lib/status"
import type { ActionItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { effectiveStatus } from "@/store/portal-store"
import { ActionStatusBadge, DueText } from "./action-meta"

/** Tarjeta compacta de "Requiere tu atención": acción, empresa, servicio, fecha, prioridad, responsable y botón directo. */
export function ActionCard({ item, onOpen }: { item: ActionItem; onOpen: (id: string) => void }) {
  const status = effectiveStatus(item)
  const assignee = item.assigneeId ? getPerson(item.assigneeId) : null
  const verb = status === "changes_required" ? "Corregir" : actionKindMeta[item.kind].verb

  return (
    <article
      className={cn(
        "group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center",
        (status === "overdue" || status === "changes_required") && "border-l-4 border-l-destructive",
        item.priority === "alta" && status !== "overdue" && status !== "changes_required" && "border-l-4 border-l-warning"
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <ActionStatusBadge item={item} />
          <span className="text-xs text-muted-foreground">{serviceNames[item.service]}</span>
        </div>
        <h3 className="font-semibold leading-snug">{item.title}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <CompanyTag companies={item.companies} />
          <DueText item={item} />
          {assignee && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserAvatar firstName={assignee.firstName} lastName={assignee.lastName} size="sm" className="size-6" />
              {assignee.firstName} {assignee.lastName}
            </span>
          )}
        </div>
      </div>
      <Button onClick={() => onOpen(item.id)} variant={status === "overdue" || status === "changes_required" ? "default" : "outline"} className="shrink-0 self-start sm:self-center">
        {verb}
        <ArrowRight />
      </Button>
    </article>
  )
}
