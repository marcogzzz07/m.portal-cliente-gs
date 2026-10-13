"use client"

import { useMemo, useState } from "react"
import { CheckCheck, Clock, Hourglass, ListChecks, TriangleAlert } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs } from "@/components/ui/tabs"
import { AccessDenied } from "@/components/shared/access-denied"
import { EmptyState } from "@/components/shared/empty-state"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { PageTabsList, PageTabsTrigger } from "@/components/shared/page-tabs"
import { Segmented } from "@/components/shared/segmented"
import { companies, serviceNames } from "@/data/organization"
import { useScopedData } from "@/hooks/use-scoped-data"
import { daysFromToday } from "@/lib/format"
import { canAccessModule } from "@/lib/permissions"
import { actionKindMeta, actionStatus } from "@/lib/status"
import type { ActionItem, ActionKind, ActionStatus, CompanyId, ServiceKey } from "@/lib/types"
import { effectiveStatus, usePortal } from "@/store/portal-store"
import { ActionDetailSheet } from "./action-detail-sheet"
import { ActionTable } from "./action-table"

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
  const { actions, scope, scopeLabel, scopeBadge } = useScopedData()
  const me = persona.personId
  const [selected, setSelected] = useState<string | null>(initialId ?? null)
  const hasMine = actions.some((a) => a.assigneeId === me && a.owner === "cliente" && a.status !== "completed")
  const [view, setView] = useState<View>(hasMine ? "mios" : "todos")
  const [groupBy, setGroupBy] = useState<GroupBy>("fecha")
  const [company, setCompany] = useState<CompanyId | "todas">("todas")
  const [service, setService] = useState<ServiceKey | "todos">("todos")
  const [kind, setKind] = useState<ActionKind | "todos">("todos")
  const [status, setStatus] = useState<ActionStatus | "todos">("todos")

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
      <PageHeader
        icon={ListChecks}
        title="Pendientes"
        badge={scopeBadge}
        description="Todo lo que tu empresa y GS necesitan hacer, con responsable y fecha. Las acciones se completan aquí mismo."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard label="Por atender" value={byView.todos.filter((a) => a.status !== "upcoming" && a.status !== "blocked").length} icon={ListChecks} accent="blue" helper="De tu empresa, al 12 oct" />
        <MetricCard label="Vencidos" value={overdue} icon={TriangleAlert} accent="pink" helper={overdue ? "Atiéndelos primero" : "Nada vencido"} />
        <MetricCard label="Esperando a GS" value={byView.gs.length} icon={Hourglass} accent="amber" helper="El siguiente paso es de GS" />
        <MetricCard label="Completados" value={byView.completados.length} icon={CheckCheck} accent="green" helper="Últimos 60 días" />
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)} className="gap-5">
        <PageTabsList>
          {(["mios", "equipo", "todos", "gs", "completados"] as View[]).map((v) => (
            <PageTabsTrigger key={v} value={v}>
              {viewLabels[v]}
              <span className="ml-2 text-muted-foreground tabular-nums">{byView[v].length}</span>
            </PageTabsTrigger>
          ))}
        </PageTabsList>

        <div className="flex flex-wrap items-center gap-3">
          {view !== "completados" && (
            <Segmented
              label="Agrupar por"
              value={groupBy}
              onChange={setGroupBy}
              options={[
                { value: "fecha", label: "Por fecha" },
                { value: "prioridad", label: "Por prioridad" },
                ...(scope === "grupo" ? [{ value: "empresa" as GroupBy, label: "Por empresa" }] : []),
                { value: "servicio", label: "Por servicio" },
              ]}
            />
          )}
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            {scope === "grupo" && (
              <Select value={company} onValueChange={(v) => setCompany(v as CompanyId | "todas")}>
                <SelectTrigger className="w-48 bg-card data-[size=default]:h-9" aria-label="Empresa">
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
              <SelectTrigger className="w-44 bg-card data-[size=default]:h-9" aria-label="Servicio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los servicios</SelectItem>
                {(["contabilidad", "impuestos", "auditoria", "legal", "facturacion"] as ServiceKey[]).map((sv) => (
                  <SelectItem key={sv} value={sv}>
                    {serviceNames[sv]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={kind} onValueChange={(v) => setKind(v as ActionKind | "todos")}>
              <SelectTrigger className="w-44 bg-card data-[size=default]:h-9" aria-label="Tipo">
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
              <SelectTrigger className="w-44 bg-card data-[size=default]:h-9" aria-label="Estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {(Object.keys(actionStatus) as ActionStatus[]).map((st) => (
                  <SelectItem key={st} value={st}>
                    {actionStatus[st].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={view === "gs" ? Clock : CheckCheck}
            title={filtersActive ? "Ningún pendiente coincide con los filtros" : view === "mios" ? "No tienes pendientes asignados" : view === "gs" ? "Nada esperando a GS" : "Sin pendientes en esta vista"}
            description={filtersActive ? "Ajusta los filtros." : `En ${scopeLabel}. Te avisaremos cuando haya algo nuevo.`}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.06]">
            <ActionTable items={list} groups={view === "completados" ? undefined : groups} onOpen={open} />
          </div>
        )}
      </Tabs>

      <ActionDetailSheet itemId={selected} onClose={close} />
    </div>
  )
}
