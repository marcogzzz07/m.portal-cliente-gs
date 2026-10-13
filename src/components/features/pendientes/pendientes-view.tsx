"use client"

import { useMemo, useState } from "react"
import { CheckCheck, ChevronRight, Clock, Hourglass, ListChecks, SlidersHorizontal, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs } from "@/components/ui/tabs"
import { AccessDenied } from "@/components/shared/access-denied"
import { CompanyTag } from "@/components/shared/company-tag"
import { EmptyState } from "@/components/shared/empty-state"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { PageTabsList, PageTabsTrigger } from "@/components/shared/page-tabs"
import { ScopeNote } from "@/components/shared/scope-note"
import { UserAvatar } from "@/components/shared/user-avatar"
import { companies, getPerson, serviceNames } from "@/data/organization"
import { useScopedData } from "@/hooks/use-scoped-data"
import { daysFromToday } from "@/lib/format"
import { canAccessModule } from "@/lib/permissions"
import { actionKindMeta, actionStatus } from "@/lib/status"
import type { ActionItem, ActionKind, ActionStatus, CompanyId, ServiceKey } from "@/lib/types"
import { cn } from "@/lib/utils"
import { effectiveStatus, usePortal } from "@/store/portal-store"
import { ActionDetailSheet } from "./action-detail-sheet"
import { ActionStatusBadge, DueText, PriorityTag } from "./action-meta"

type View = "mios" | "equipo" | "gs" | "completados" | "todos"
type GroupBy = "fecha" | "prioridad" | "empresa" | "servicio"

const viewLabels: Record<View, string> = {
  todos: "Todos",
  mios: "Míos",
  equipo: "De mi equipo",
  gs: "Esperando a GS",
  completados: "Completados",
}

function dateBucket(item: ActionItem) {
  const d = daysFromToday(item.dueDate)
  if (effectiveStatus(item) === "overdue") return "0|Vencidos"
  if (d <= 6) return "1|Esta semana"
  if (d <= 20) return "2|Próximas dos semanas"
  return "3|Más adelante"
}

const priorityOrder = { alta: 0, media: 1, baja: 2 }

/** Bandeja de pendientes (Product Spec §10): vistas, filtros, agrupación y detalle con acción directa. */
export function PendientesView({ initialId }: { initialId?: string }) {
  const { persona } = usePortal()
  const { actions, scope, scopeLabel } = useScopedData()
  const me = persona.personId
  const [selected, setSelected] = useState<string | null>(initialId ?? null)
  const hasMine = actions.some((a) => a.assigneeId === me && a.owner === "cliente" && a.status !== "completed")
  const [view, setView] = useState<View>(hasMine ? "mios" : "todos")
  const [groupBy, setGroupBy] = useState<GroupBy>("fecha")
  const [company, setCompany] = useState<CompanyId | "todas">("todas")
  const [service, setService] = useState<ServiceKey | "todos">("todos")
  const [kind, setKind] = useState<ActionKind | "todos">("todos")
  const [status, setStatus] = useState<ActionStatus | "todos">("todos")
  const [showFilters, setShowFilters] = useState(false)

  const byView = useMemo(() => {
    const open = (a: ActionItem) => a.status !== "completed"
    return {
      todos: actions.filter((a) => a.owner === "cliente" && open(a)),
      mios: actions.filter((a) => a.owner === "cliente" && a.assigneeId === me && open(a)),
      equipo: actions.filter((a) => a.owner === "cliente" && a.assigneeId !== me && open(a)),
      gs: actions.filter((a) => a.owner === "gs" && open(a)),
      completados: actions.filter((a) => a.status === "completed"),
    } satisfies Record<View, ActionItem[]>
  }, [actions, me])

  const list = byView[view].filter(
    (a) =>
      (company === "todas" || a.companies.includes(company)) &&
      (service === "todos" || a.service === service) &&
      (kind === "todos" || a.kind === kind) &&
      (status === "todos" || effectiveStatus(a) === status)
  )

  const groups = useMemo(() => {
    if (view === "completados") return [{ key: "Completados", items: [...list].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")) }]
    const keyOf = (a: ActionItem) => {
      switch (groupBy) {
        case "fecha":
          return dateBucket(a)
        case "prioridad":
          return `${priorityOrder[a.priority]}|Prioridad ${a.priority}`
        case "empresa":
          return a.companies.length > 1 ? "0|Varias empresas" : `1|${companies.find((c) => c.id === a.companies[0])!.name}`
        case "servicio":
          return `0|${serviceNames[a.service]}`
      }
    }
    const map = new Map<string, ActionItem[]>()
    for (const a of [...list].sort((x, y) => x.dueDate.localeCompare(y.dueDate))) {
      const k = keyOf(a)
      map.set(k, [...(map.get(k) ?? []), a])
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, items]) => ({ key: k.split("|")[1], items }))
  }, [list, groupBy, view])

  if (!canAccessModule(persona, "pendientes")) return <AccessDenied />

  const overdue = byView.todos.filter((a) => effectiveStatus(a) === "overdue").length
  const filtersActive = [company !== "todas", service !== "todos", kind !== "todos", status !== "todos"].filter(Boolean).length

  function open(id: string) {
    setSelected(id)
    window.history.replaceState(null, "", `/pendientes/${id}`)
  }
  function close() {
    setSelected(null)
    window.history.replaceState(null, "", "/pendientes")
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={ListChecks} title="Pendientes" description="Todo lo que tu empresa y GS necesitan hacer, con responsable y fecha. Las acciones se completan aquí mismo." />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Por atender" value={byView.todos.filter((a) => a.status !== "upcoming" && a.status !== "blocked").length} icon={ListChecks} accent="blue" helper={scopeLabel} />
        <MetricCard label="Vencidos" value={overdue} icon={TriangleAlert} accent="pink" helper={overdue ? "Atiéndelos primero" : "Nada vencido"} />
        <MetricCard label="Esperando a GS" value={byView.gs.length} icon={Hourglass} accent="amber" helper="El siguiente paso es de GS" />
        <MetricCard label="Completados" value={byView.completados.length} icon={CheckCheck} accent="green" helper="Últimos 60 días" />
      </div>
      <ScopeNote scope={scopeLabel} period="Al 12 oct 2026" source="portal" className="-mt-3" />

      <Tabs value={view} onValueChange={(v) => setView(v as View)} className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PageTabsList className="lg:w-auto lg:border-b-0">
            {(["mios", "equipo", "todos", "gs", "completados"] as View[]).map((v) => (
              <PageTabsTrigger key={v} value={v} className="px-3 sm:px-4">
                {viewLabels[v]}
                <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground tabular-nums">{byView[v].length}</span>
              </PageTabsTrigger>
            ))}
          </PageTabsList>
          <div className="flex flex-wrap items-center gap-2">
            {view !== "completados" && (
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                <SelectTrigger size="sm" className="w-[180px]" aria-label="Agrupar por">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fecha">Agrupar por fecha</SelectItem>
                  <SelectItem value="prioridad">Agrupar por prioridad</SelectItem>
                  {scope === "grupo" && <SelectItem value="empresa">Agrupar por empresa</SelectItem>}
                  <SelectItem value="servicio">Agrupar por servicio</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant={filtersActive ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
              <SlidersHorizontal />
              Filtros{filtersActive ? ` (${filtersActive})` : ""}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-2 lg:grid-cols-5">
            {scope === "grupo" && (
              <Select value={company} onValueChange={(v) => setCompany(v as CompanyId | "todas")}>
                <SelectTrigger className="w-full" aria-label="Empresa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las empresas</SelectItem>
                  {companies
                    .filter((c) => persona.companies.includes(c.id))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            <Select value={service} onValueChange={(v) => setService(v as ServiceKey | "todos")}>
              <SelectTrigger className="w-full" aria-label="Servicio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los servicios</SelectItem>
                {(["contabilidad", "impuestos", "auditoria", "legal", "facturacion"] as ServiceKey[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {serviceNames[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={kind} onValueChange={(v) => setKind(v as ActionKind | "todos")}>
              <SelectTrigger className="w-full" aria-label="Tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {(Object.keys(actionKindMeta) as ActionKind[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {actionKindMeta[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as ActionStatus | "todos")}>
              <SelectTrigger className="w-full" aria-label="Estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {(Object.keys(actionStatus) as ActionStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {actionStatus[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={() => {
                setCompany("todas")
                setService("todos")
                setKind("todos")
                setStatus("todos")
              }}
              disabled={!filtersActive}
            >
              Limpiar filtros
            </Button>
          </div>
        )}

        {list.length === 0 ? (
          <EmptyState
            icon={view === "gs" ? Clock : CheckCheck}
            title={filtersActive ? "Ningún pendiente coincide con los filtros" : view === "mios" ? "No tienes pendientes asignados" : view === "gs" ? "Nada esperando a GS" : "Sin pendientes en esta vista"}
            description={filtersActive ? "Ajusta o limpia los filtros." : `En ${scopeLabel}. Te avisaremos cuando haya algo nuevo.`}
          />
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <section key={g.key} aria-label={g.key} className="space-y-2">
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {g.key}
                  <span className="rounded-full bg-muted px-1.5 tabular-nums">{g.items.length}</span>
                </h2>
                <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                  {g.items.map((a) => (
                    <ActionRow key={a.id} item={a} onOpen={open} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Tabs>

      <ActionDetailSheet itemId={selected} onClose={close} />
    </div>
  )
}

function ActionRow({ item, onOpen }: { item: ActionItem; onOpen: (id: string) => void }) {
  const assignee = item.assigneeId ? getPerson(item.assigneeId) : null
  const status = effectiveStatus(item)
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none sm:items-center",
          (status === "overdue" || status === "changes_required") && "bg-destructive/[0.03]"
        )}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ActionStatusBadge item={item} />
            <span className="text-xs text-muted-foreground">
              {serviceNames[item.service]} · {actionKindMeta[item.kind].label}
            </span>
          </div>
          <p className="font-medium leading-snug">{item.title}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <CompanyTag companies={item.companies} />
            <DueText item={item} />
            <PriorityTag priority={item.priority} className="hidden sm:inline-flex" />
          </div>
        </div>
        {assignee && (
          <span className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <UserAvatar firstName={assignee.firstName} lastName={assignee.lastName} size="sm" />
            <span className="w-28 truncate">
              {assignee.firstName} {assignee.lastName}
            </span>
          </span>
        )}
        {!assignee && item.owner === "gs" && <span className="hidden w-36 truncate text-sm text-muted-foreground md:block">GS · {getPerson(item.gsOwnerId).firstName}</span>}
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground sm:mt-0" />
      </button>
    </li>
  )
}
