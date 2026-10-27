"use client"

import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getPerson, serviceNames } from "@/data/organization"
import { dueLabel, formatDate } from "@/lib/format"
import { companiesLabel } from "@/lib/labels"
import { actionKindMeta } from "@/lib/status"
import type { ActionItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { effectiveStatus } from "@/store/portal-store"
import { ActionStatusBadge } from "./action-meta"

function ownerName(a: ActionItem) {
  if (a.owner === "gs" && !a.assigneeId) return `GS · ${getPerson(a.gsOwnerId).firstName} ${getPerson(a.gsOwnerId).lastName}`
  if (!a.assigneeId) return "Sin asignar"
  const p = getPerson(a.assigneeId)
  return `${p.firstName} ${p.lastName}`
}

function dueText(a: ActionItem) {
  const status = effectiveStatus(a)
  if (status === "completed") return a.completedAt ? `Completado el ${formatDate(a.completedAt.slice(0, 10))}` : "Completado"
  if (a.status === "upcoming" && a.opensOn) return `Se abre el ${formatDate(a.opensOn)}`
  return formatDate(a.dueDate)
}

function isUrgent(a: ActionItem) {
  const s = effectiveStatus(a)
  return s === "overdue" || s === "changes_required" || (a.owner === "cliente" && s === "open" && /hoy|mañana/.test(dueLabel(a.dueDate)))
}

interface ActionTableProps {
  items: ActionItem[]
  onOpen: (id: string) => void
  /** Botón de acción por fila (en Inicio). En la bandeja se abre la fila completa. */
  showActionButton?: boolean
  /** Filas de agrupación (p. ej. "Esta semana") antes de cada bloque. */
  groups?: { key: string; items: ActionItem[] }[]
}

/** Tabla de pendientes: amplia en escritorio y lista apilada en móvil. */
export function ActionTable({ items, onOpen, showActionButton = false, groups }: ActionTableProps) {
  const blocks = groups ?? [{ key: "", items }]

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Pendiente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Fecha límite</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-0" aria-label="Acción" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocks.map((b) => (
              <GroupRows key={b.key || "all"} label={b.key} count={b.items.length}>
                {b.items.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => onOpen(a.id)}>
                    <TableCell className="w-[40%] max-w-0">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {serviceNames[a.service]} · {actionKindMeta[a.kind].label}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{companiesLabel(a.companies)}</TableCell>
                    <TableCell className={cn("tabular-nums", isUrgent(a) ? "font-medium text-destructive" : "text-muted-foreground")}>{dueText(a)}</TableCell>
                    <TableCell className="text-muted-foreground">{ownerName(a)}</TableCell>
                    <TableCell>
                      <ActionStatusBadge item={a} />
                    </TableCell>
                    <TableCell className="text-right">
                      {showActionButton ? (
                        <Button
                          size="sm"
                          variant={isUrgent(a) ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpen(a.id)
                          }}
                        >
                          {effectiveStatus(a) === "changes_required" ? "Corregir" : actionKindMeta[a.kind].verb}
                        </Button>
                      ) : (
                        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </GroupRows>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y md:hidden">
        {blocks.flatMap((b) => [
          ...(b.key ? [<li key={`h-${b.key}`} className="bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground">{b.key}</li>] : []),
          ...b.items.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => onOpen(a.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-muted">
                <span className="min-w-0 flex-1 space-y-1.5">
                  <span className="block font-medium leading-snug">{a.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {companiesLabel(a.companies)} · <span className={cn(isUrgent(a) && "font-medium text-destructive")}>{dueText(a)}</span>
                  </span>
                  <ActionStatusBadge item={a} />
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          )),
        ])}
      </ul>
    </>
  )
}

function GroupRows({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <>
      {label && (
        <TableRow className="bg-muted hover:bg-muted">
          <TableCell colSpan={6} className="py-1.5 text-xs font-semibold text-muted-foreground">
            {label} <span className="ml-1 tabular-nums">· {count}</span>
          </TableCell>
        </TableRow>
      )}
      {children}
    </>
  )
}
