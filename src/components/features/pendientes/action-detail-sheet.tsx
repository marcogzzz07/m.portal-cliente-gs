"use client"

import Link from "next/link"
import { AlertCircle, ArrowUpRight, CheckCircle2, Circle, FileText, MessageSquare } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { InfoGrid } from "@/components/shared/info-grid"
import { PersonChip } from "@/components/shared/person-chip"
import { getPerson, serviceNames } from "@/data/organization"
import { formatDate, formatDateTime } from "@/lib/format"
import { companiesLabel } from "@/lib/labels"
import { canSeeAction } from "@/lib/permissions"
import { actionKindMeta } from "@/lib/status"
import { usePortal } from "@/store/portal-store"
import { ActionPanel } from "./action-panel"
import { ActionStatusBadge, DueText, PriorityTag } from "./action-meta"

/** Detalle de un pendiente: qué, quién y cuándo, requisitos, historial y acción principal. */
export function ActionDetailSheet({ itemId, onClose }: { itemId: string | null; onClose: () => void }) {
  const { state, persona } = usePortal()
  const item = itemId ? state.actionItems.find((a) => a.id === itemId) : undefined
  const visible = item && canSeeAction(persona, item)
  const doc = item?.documentId ? state.documents.find((d) => d.id === item.documentId) : undefined

  return (
    <Sheet open={Boolean(itemId)} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {!item || !visible ? (
          <SheetHeader>
            <SheetTitle>Pendiente no disponible</SheetTitle>
            <SheetDescription>No existe o tu rol no tiene acceso a este pendiente.</SheetDescription>
          </SheetHeader>
        ) : (
          <>
            <SheetHeader className="gap-2 border-b pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <ActionStatusBadge item={item} />
                <Badge variant="outline">{actionKindMeta[item.kind].label}</Badge>
                <span className="text-xs text-muted-foreground">{item.id}</span>
              </div>
              <SheetTitle className="text-lg leading-snug">{item.title}</SheetTitle>
              <SheetDescription>{item.description}</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-4">
              {item.status === "changes_required" && item.reviewNote && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div>
                    <p className="font-semibold text-destructive">Motivo de la corrección</p>
                    <p>{item.reviewNote}</p>
                  </div>
                </div>
              )}

              <InfoGrid
                items={[
                  { label: "Empresa", value: companiesLabel(item.companies) },
                  { label: "Servicio", value: serviceNames[item.service] },
                  { label: "Fecha límite", value: <DueText item={item} /> },
                  { label: "Prioridad", value: <PriorityTag priority={item.priority} /> },
                  { label: "Responsable en tu empresa", value: item.assigneeId ? <PersonChip id={item.assigneeId} /> : "Sin asignar" },
                  { label: "Responsable GS", value: <PersonChip id={item.gsOwnerId} /> },
                ]}
              />

              <ActionPanel item={item} />

              {item.requirements && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Qué necesitamos</h3>
                  <ul className="space-y-1.5">
                    {item.requirements.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(doc || item.conversationId || item.relatedHref) && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Relacionado</h3>
                  <div className="flex flex-col gap-1.5">
                    {doc && (
                      <Button variant="outline" asChild className="h-auto justify-start py-2">
                        <Link href={`/documentos/${doc.id}`}>
                          <FileText />
                          <span className="flex-1 truncate text-left">
                            {doc.name} · {doc.period}
                          </span>
                          <ArrowUpRight className="text-muted-foreground" />
                        </Link>
                      </Button>
                    )}
                    {item.conversationId && (
                      <Button variant="outline" asChild className="h-auto justify-start py-2">
                        <Link href={`/mensajes/${item.conversationId}`}>
                          <MessageSquare />
                          <span className="flex-1 truncate text-left">Conversación con GS</span>
                          <ArrowUpRight className="text-muted-foreground" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </section>
              )}

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Historial</h3>
                <ol className="relative space-y-3 border-l pl-4">
                  {[...item.history].reverse().map((h, i) => (
                    <li key={`${h.at}-${i}`} className="relative">
                      <Circle className="absolute top-1 -left-[21.5px] size-2.5 fill-background text-muted-foreground" />
                      <p className="text-sm">{h.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(h.at)}
                        {h.by && ` · ${getPerson(h.by).org === "gs" ? "GS" : "Tu empresa"}`}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>

              <p className="text-xs text-muted-foreground">
                Creado {formatDate(item.history[0]?.at.slice(0, 10) ?? item.dueDate)}. Todas las acciones quedan registradas.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
