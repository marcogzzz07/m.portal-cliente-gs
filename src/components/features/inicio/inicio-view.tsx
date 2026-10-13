"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, BadgeCheck, Briefcase, CalendarDays, CheckCircle2, FileUp, Home, Lightbulb, ListChecks, MessageSquare, PackageCheck, ShieldCheck, TrendingUp, Wallet } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { activity, insights } from "@/data/activity"
import { getPerson, metrics, services } from "@/data/organization"
import { useScopedData } from "@/hooks/use-scoped-data"
import { DEMO_TODAY, daysFromToday, dueLabel, formatCompactCurrency, formatCurrency, formatDate, formatLongDate, formatPercent } from "@/lib/format"
import { companiesLabel, companyShort } from "@/lib/labels"
import { canAccessModule, matchesScope } from "@/lib/permissions"
import { eventTypeMeta, healthMeta } from "@/lib/status"
import type { Activity, ServiceHealth } from "@/lib/types"
import { cn } from "@/lib/utils"
import { effectiveStatus, usePortal } from "@/store/portal-store"
import { UploadDialog } from "../documentos/upload-dialog"
import { ActionDetailSheet } from "../pendientes/action-detail-sheet"
import { ActionTable } from "../pendientes/action-table"
import { AlertsCard, type AlertItem } from "./alerts-card"
import { InsightCard } from "./insight-card"

const healthRank: ServiceHealth[] = ["atrasado", "requiere_atencion", "en_curso", "al_corriente"]
const activityLabel: Record<Activity["kind"], string> = { hito: "Hito", entregable: "Entregable", obligacion: "Obligación", revision: "Revisión" }
const revenueConfig = { ingresos: { label: "Ingresos ene–ago", color: "var(--chart-1)" } } satisfies ChartConfig

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"
}

/** Inicio ejecutivo (Product Spec §9): qué requiere atención, panorama, lo que hizo GS, qué viene y qué decidir. */
export function InicioView() {
  const { persona, can } = usePortal()
  const { actions, documents, events, scope, scopeLabel, scopeBadge, scopeCompanies } = useScopedData()
  const [selected, setSelected] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const me = getPerson(persona.personId)
  const isExec = persona.role === "admin" || persona.role === "ejecutivo"
  const seesBilling = canAccessModule(persona, "facturacion")
  const seesActions = canAccessModule(persona, "pendientes")

  // Requiere tu atención: máximo cinco, lo más urgente primero.
  const rank = (s: string) => (s === "overdue" ? 0 : s === "changes_required" ? 1 : 2)
  const prio = { alta: 0, media: 1, baja: 2 }
  const attentionAll = actions
    .filter((a) => a.owner === "cliente" && !["completed", "upcoming", "blocked"].includes(a.status))
    .filter((a) => isExec || a.assigneeId === persona.personId || persona.role === "operativo")
    .sort((a, b) => rank(effectiveStatus(a)) - rank(effectiveStatus(b)) || prio[a.priority] - prio[b.priority] || a.dueDate.localeCompare(b.dueDate))
  const attention = attentionAll.slice(0, 5)
  const overdue = attentionAll.filter((a) => effectiveStatus(a) === "overdue").length
  const corrections = attentionAll.filter((a) => effectiveStatus(a) === "changes_required").length

  // Panorama
  const m = scopeCompanies.map((c) => metrics[c])
  const sum = (fn: (x: (typeof m)[number]) => number) => m.reduce((s, x) => s + fn(x), 0)
  const onTime = sum((x) => x.compliance.onTime)
  const totalObl = sum((x) => x.compliance.total)
  const late = totalObl - onTime
  const published = sum((x) => x.deliverables.published)
  const expected = sum((x) => x.deliverables.expected)
  const revenueYtd = sum((x) => x.revenueYtd)
  const revenueSep = sum((x) => x.revenueSep)
  const revenuePrev = sum((x) => x.revenueSepPrev)
  const margin = sum((x) => x.grossMargin * x.revenueYtd) / revenueYtd
  const balanceDue = sum((x) => x.balance.due)
  const balanceOverdue = sum((x) => x.balance.overdue)
  const docsPending = documents.filter((d) => d.direction === "cliente" && (d.status === "requested" || d.status === "changes_required")).length
  const docsInReview = documents.filter((d) => d.direction === "cliente" && (d.status === "uploaded" || d.status === "under_review")).length

  const scopedServices = services
    .filter((s) => matchesScope(s.companies, scope, persona.companies))
    .map((s) => {
      const relevant = (scope === "grupo" ? s.companies.filter((c) => persona.companies.includes(c)) : [scope]).map((c) => s.health[c]).filter(Boolean) as ServiceHealth[]
      return { ...s, scopedHealth: healthRank.find((h) => relevant.includes(h)) ?? ("al_corriente" as ServiceHealth) }
    })

  const done = activity.filter((a) => matchesScope(a.companies, scope, persona.companies)).slice(0, 5)
  const visibleInsights = insights.filter((i) => matchesScope(i.companies, scope, persona.companies) && (isExec || (persona.role === "operativo" && i.service === "impuestos")))
  const upcoming = events.filter((e) => daysFromToday(e.endDate ?? e.date) >= 0).slice(0, 5)

  // Alertas: lo vencido, lo que pide corrección y los vencimientos críticos.
  const alerts: AlertItem[] = [
    ...attentionAll
      .filter((a) => effectiveStatus(a) === "overdue" || effectiveStatus(a) === "changes_required")
      .map((a) => ({
        id: a.id,
        tone: "danger" as const,
        text: effectiveStatus(a) === "overdue" ? `${a.title} (${companyShort(a.companies[0])}): ${dueLabel(a.dueDate).toLowerCase()}.` : `${a.title}: GS pidió una corrección.`,
        href: `/pendientes/${a.id}`,
      })),
    ...(seesBilling && balanceOverdue > 0 ? [{ id: "saldo", tone: "warning" as const, text: `Hay ${formatCurrency(balanceOverdue)} vencidos en facturas de GS.` }] : []),
    ...events
      .filter((e) => e.type === "renovacion" && daysFromToday(e.date) >= 0 && daysFromToday(e.date) <= 30)
      .map((e) => ({ id: e.id, tone: "warning" as const, text: `${e.title}: ${formatDate(e.date, { day: "numeric", month: "long" })}.` })),
  ].slice(0, 4)

  const revenueByCompany = scopeCompanies.map((c) => ({ empresa: companyShort(c), ingresos: metrics[c].revenueYtd }))

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Home}
        title={`${greeting()}, ${me.firstName}`}
        badge={scopeBadge}
        description={`${formatLongDate(DEMO_TODAY).replace(/^./, (c) => c.toUpperCase())}. ${
          seesActions ? (attentionAll.length ? `Tienes ${attentionAll.length} ${attentionAll.length === 1 ? "acción" : "acciones"} por atender.` : "No tienes acciones por atender.") : "Tu acceso es de consulta."
        }`}
        actions={
          <>
            {can.upload && (
              <Button variant="outline" onClick={() => setUploadOpen(true)}>
                <FileUp />
                Enviar documento
              </Button>
            )}
            {can.respond && (
              <Button asChild>
                <Link href="/mensajes/nuevo">
                  <MessageSquare />
                  Escribir a GS
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* Panorama */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {seesActions ? (
          <MetricCard
            label="Por atender"
            value={attentionAll.length}
            icon={ListChecks}
            accent="pink"
            href="/pendientes"
            helper={overdue || corrections ? [overdue && `${overdue} vencido${overdue > 1 ? "s" : ""}`, corrections && `${corrections} con corrección`].filter(Boolean).join(" · ") : "Nada vencido"}
          />
        ) : (
          <MetricCard label="Servicios activos" value={scopedServices.length} icon={Briefcase} accent="pink" helper="Octubre 2026" />
        )}
        <MetricCard label="Cumplimiento fiscal" value={formatPercent(onTime / totalObl, 1)} icon={ShieldCheck} accent="green" helper={`${onTime} de ${totalObl} obligaciones a tiempo en 2026${late ? ` · ${late} extemporánea${late > 1 ? "s" : ""}` : ""}`} />
        <MetricCard label="Entregables del mes" value={`${published} de ${expected}`} icon={PackageCheck} accent="amber" helper="Septiembre · publicados por GS" />
        {seesBilling ? (
          <MetricCard label="Saldo con GS" value={formatCompactCurrency(balanceDue + balanceOverdue)} icon={Wallet} accent="blue" helper={balanceOverdue ? `${formatCompactCurrency(balanceOverdue)} vencido · Odoo` : "Al corriente · Odoo"} />
        ) : (
          <MetricCard label="Documentos por enviar" value={docsPending} icon={FileUp} accent="blue" href="/documentos" helper={`${docsInReview} en revisión de GS`} />
        )}
      </div>

      {/* Requiere tu atención */}
      {seesActions && (
        <SectionCard
          title="Requiere tu atención"
          description={attentionAll.length > 5 ? `Las 5 más urgentes de ${attentionAll.length}` : "Lo más urgente primero"}
          icon={ListChecks}
          flush
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/pendientes">
                Ver todos
                <ArrowRight />
              </Link>
            </Button>
          }
        >
          {attention.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState icon={CheckCircle2} title="Todo al día" description={`No hay acciones pendientes para ti en ${scopeLabel}.`} />
            </div>
          ) : (
            <ActionTable items={attention} onOpen={setSelected} showActionButton />
          )}
        </SectionCard>
      )}

      {/* Indicadores + alertas */}
      <div className="grid gap-4 lg:grid-cols-3">
        {isExec ? (
          <SectionCard
            title="Indicadores financieros"
            description={`${scopeLabel}${scope === "grupo" ? " (suma de razones sociales)" : ""} · ene–ago cerrado, septiembre preliminar · ContaLink`}
            icon={TrendingUp}
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-3 gap-4 border-b pb-5">
              <div>
                <p className="text-[13px] text-muted-foreground">Ingresos ene–ago</p>
                <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{formatCompactCurrency(revenueYtd)}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Septiembre</p>
                <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{formatCompactCurrency(revenueSep)}</p>
                <p className="text-xs text-success">+{formatPercent(revenueSep / revenuePrev - 1, 1)} vs. agosto</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Margen bruto</p>
                <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{formatPercent(margin, 1)}</p>
              </div>
            </div>
            {scope === "grupo" ? (
              <ChartContainer config={revenueConfig} className="mt-4 aspect-auto h-52 w-full">
                <BarChart data={revenueByCompany} margin={{ left: 0, right: 0, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="empresa" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `$${Math.round(Number(v) / 1_000_000)} M`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v), 0)} />} />
                  <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">El estado de resultados y el balance de esta empresa estarán en Servicios › Contabilidad (Fase 2).</p>
            )}
          </SectionCard>
        ) : (
          <ServicesCard services={scopedServices} className="lg:col-span-2" />
        )}
        <AlertsCard items={alerts} />
      </div>

      {isExec && <ServicesCard services={scopedServices} />}

      {/* Qué viene y qué hizo GS */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Próximas fechas"
          description="Vencimientos, reuniones y entregas"
          icon={CalendarDays}
          flush
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/calendario">Calendario</Link>
            </Button>
          }
        >
          <ul className="divide-y border-t">
            {upcoming.map((e) => {
              const clickable = e.actionItemId && seesActions
              const body = (
                <>
                  <span className="w-14 shrink-0 text-[13px] text-muted-foreground tabular-nums">{e.date === DEMO_TODAY ? "Hoy" : formatDate(e.date)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{e.title}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {companiesLabel(e.companies)}
                      {e.time && ` · ${e.time} h`}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className={cn("size-1.5 rounded-full", eventTypeMeta[e.type].dot)} aria-hidden />
                    {eventTypeMeta[e.type].label}
                  </span>
                </>
              )
              return (
                <li key={e.id}>
                  {clickable ? (
                    <button type="button" onClick={() => setSelected(e.actionItemId!)} className="flex w-full items-center gap-4 px-6 py-3.5 text-left text-sm hover:bg-muted/50">
                      {body}
                    </button>
                  ) : (
                    <div className="flex items-center gap-4 px-6 py-3.5 text-sm">{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title="Lo que hizo GS"
          description="Hitos, entregables y revisiones de los últimos 30 días"
          icon={BadgeCheck}
          flush
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/documentos">Documentos</Link>
            </Button>
          }
        >
          <ul className="divide-y border-t">
            {done.map((a) => {
              const by = getPerson(a.byId)
              const body = (
                <>
                  <span className="w-14 shrink-0 text-[13px] text-muted-foreground tabular-nums">{formatDate(a.date)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{a.title}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {a.detail} · {by.firstName} {by.lastName}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] text-muted-foreground">{activityLabel[a.kind]}</span>
                </>
              )
              return (
                <li key={a.id}>
                  {a.href ? (
                    <Link href={a.href} className="flex items-center gap-4 px-6 py-3.5 text-sm hover:bg-muted/50">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-4 px-6 py-3.5 text-sm">{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </SectionCard>
      </div>

      {/* Qué conviene decidir */}
      {visibleInsights.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2.5 text-[17px] font-medium">
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <Lightbulb className="size-4" />
            </span>
            Análisis de GS
          </h2>
          <div className={cn("grid gap-4", visibleInsights.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
            {visibleInsights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </div>
        </section>
      )}

      <ActionDetailSheet itemId={selected} onClose={() => setSelected(null)} />
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  )
}

function ServicesCard({ services: list, className }: { services: ((typeof services)[number] & { scopedHealth: ServiceHealth })[]; className?: string }) {
  return (
    <SectionCard title="Estado de servicios" description="Detalle por servicio en la Fase 2" icon={Briefcase} flush className={className}>
      <ul className="divide-y border-t md:hidden">
        {list.map((s) => (
          <li key={s.id} className="space-y-1.5 px-5 py-4">
            <p className="font-medium leading-snug">{s.name}</p>
            <p className="text-[13px] text-muted-foreground">
              {s.nextMilestone.title} · {formatDate(s.nextMilestone.date)}
            </p>
            <StatusBadge {...healthMeta[s.scopedHealth]} />
          </li>
        ))}
      </ul>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Servicio</TableHead>
            <TableHead>Próximo hito</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Responsable GS</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="w-[30%] max-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="truncate text-[13px] text-muted-foreground">{s.period}</p>
              </TableCell>
              <TableCell className="w-[34%] max-w-0 truncate text-muted-foreground">{s.nextMilestone.title}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums">{formatDate(s.nextMilestone.date)}</TableCell>
              <TableCell className="text-muted-foreground">
                {getPerson(s.leadId).firstName} {getPerson(s.leadId).lastName}
              </TableCell>
              <TableCell>
                <StatusBadge {...healthMeta[s.scopedHealth]} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  )
}
