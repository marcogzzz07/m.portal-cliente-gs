"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  FileClock,
  FileUp,
  Flag,
  Landmark,
  MessageSquare,
  PackageCheck,
  ScanSearch,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { MetricCard } from "@/components/shared/metric-card"
import { PersonChip } from "@/components/shared/person-chip"
import { PhaseBadge } from "@/components/shared/phase-badge"
import { ScopeNote } from "@/components/shared/scope-note"
import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { activity, insights } from "@/data/activity"
import { getPerson, gsTeam, metrics, services } from "@/data/organization"
import { useScopedData } from "@/hooks/use-scoped-data"
import { daysFromToday, formatCompactCurrency, formatCurrency, formatDate, formatLongDate, formatPercent, DEMO_TODAY } from "@/lib/format"
import { companyShort } from "@/lib/labels"
import { canAccessModule, matchesScope } from "@/lib/permissions"
import { eventTypeMeta, healthMeta } from "@/lib/status"
import type { Activity, ServiceHealth } from "@/lib/types"
import { cn } from "@/lib/utils"
import { effectiveStatus, usePortal } from "@/store/portal-store"
import { UploadDialog } from "../documentos/upload-dialog"
import { ActionCard } from "../pendientes/action-card"
import { ActionDetailSheet } from "../pendientes/action-detail-sheet"
import { InsightCard } from "./insight-card"

const healthRank: ServiceHealth[] = ["atrasado", "requiere_atencion", "en_curso", "al_corriente"]
const activityIcon: Record<Activity["kind"], typeof Flag> = { hito: Flag, entregable: PackageCheck, obligacion: Landmark, revision: ScanSearch }
const activityLabel: Record<Activity["kind"], string> = { hito: "Hito", entregable: "Entregable", obligacion: "Obligación", revision: "Revisión" }

const revenueConfig = { ingresos: { label: "Ingresos ene–ago", color: "var(--chart-2)" } } satisfies ChartConfig

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"
}

/** Sección con la pregunta del Product Spec §1 como antetítulo. */
function Question({ q, title, action, children, id }: { q: string; title: string; action?: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-brand uppercase">{q}</p>
          <h2 id={id} className="text-lg font-bold tracking-tight">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Inicio ejecutivo (Product Spec §9): responde las cinco preguntas en el contexto activo. */
export function InicioView() {
  const { persona, state, can } = usePortal()
  const { actions, documents, events, scope, scopeLabel, scopeCompanies } = useScopedData()
  const [selected, setSelected] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const me = getPerson(persona.personId)
  const isExec = persona.role === "admin" || persona.role === "ejecutivo"
  const seesBilling = canAccessModule(persona, "facturacion")

  // 1. Requiere tu atención: máximo cinco, lo más urgente primero.
  const rank = (s: string) => (s === "overdue" ? 0 : s === "changes_required" ? 1 : 2)
  const prio = { alta: 0, media: 1, baja: 2 }
  const attentionAll = actions
    .filter((a) => a.owner === "cliente" && !["completed", "upcoming", "blocked"].includes(a.status))
    .filter((a) => isExec || a.assigneeId === persona.personId || persona.role === "operativo")
    .sort((a, b) => rank(effectiveStatus(a)) - rank(effectiveStatus(b)) || prio[a.priority] - prio[b.priority] || a.dueDate.localeCompare(b.dueDate))
  const attention = attentionAll.slice(0, 5)

  // 2. Panorama
  const m = scopeCompanies.map((c) => metrics[c])
  const sum = (fn: (x: (typeof m)[number]) => number) => m.reduce((s, x) => s + fn(x), 0)
  const onTime = sum((x) => x.compliance.onTime)
  const totalObl = sum((x) => x.compliance.total)
  const lateNotes = scopeCompanies.flatMap((c) => metrics[c].compliance.late.map((l) => `${companyShort(c)}: ${l}`))
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
      const health = healthRank.find((h) => relevant.includes(h)) ?? "al_corriente"
      return { ...s, scopedHealth: health }
    })
  const attentionServices = scopedServices.filter((s) => s.scopedHealth === "requiere_atencion" || s.scopedHealth === "atrasado").length

  // 3. Lo que hizo GS
  const done = activity.filter((a) => matchesScope(a.companies, scope, persona.companies))
  const nextGs = actions.filter((a) => a.owner === "gs" && !["completed", "submitted", "under_review"].includes(a.status)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3)

  // 4. Insights: los financieros solo para dirección.
  const visibleInsights = insights.filter((i) => matchesScope(i.companies, scope, persona.companies) && (isExec || (persona.role === "operativo" && i.service === "impuestos")))

  // 5. Próximas fechas
  const upcoming = events.filter((e) => daysFromToday(e.endDate ?? e.date) >= 0).slice(0, 6)

  const primary = gsTeam.find((g) => g.primary)!
  const revenueByCompany = scopeCompanies.map((c) => ({ empresa: companyShort(c), ingresos: metrics[c].revenueYtd }))

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground first-letter:uppercase">{formatLongDate(DEMO_TODAY)}</p>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">
            {greeting()}, {me.firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Estás viendo <span className="font-semibold text-foreground">{scopeLabel}</span>
            {scope === "grupo" && ` · ${scopeCompanies.length} razones sociales`}.{" "}
            {attentionAll.length > 0 ? `Tienes ${attentionAll.length} ${attentionAll.length === 1 ? "acción" : "acciones"} por atender.` : "No tienes acciones por atender."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          {/* 1 */}
          {canAccessModule(persona, "pendientes") ? (
            <Question
              q="¿Qué requiere mi atención?"
              title="Requiere tu atención"
              id="q1"
              action={
                attentionAll.length > 0 && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/pendientes">
                      Ver {attentionAll.length > 5 ? `los ${attentionAll.length}` : "todos"}
                      <ArrowRight />
                    </Link>
                  </Button>
                )
              }
            >
              {attention.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="Todo al día" description={`No hay acciones pendientes para ti en ${scopeLabel}.`} />
              ) : (
                <div className="space-y-2.5">
                  {attention.map((a) => (
                    <ActionCard key={a.id} item={a} onOpen={setSelected} />
                  ))}
                </div>
              )}
            </Question>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p>
                Tu acceso es <span className="font-semibold">de consulta</span> para {scopeLabel}. Puedes ver entregables, calendario y equipo; las acciones las atiende tu administrador.
              </p>
            </div>
          )}

          {/* 2 */}
          <Question q="¿Cómo está mi empresa?" title="Panorama" id="q2">
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <MetricCard
                  label="Cumplimiento fiscal 2026"
                  value={formatPercent(onTime / totalObl, 1)}
                  icon={ShieldCheck}
                  accent="green"
                  progress={(onTime / totalObl) * 100}
                  helper={`${onTime} de ${totalObl} obligaciones a tiempo${lateNotes.length ? ` · ${lateNotes.length} extemporánea${lateNotes.length > 1 ? "s" : ""}` : ""}`}
                  footer={<ScopeNote scope={scopeLabel} period="Ene–sep 2026" source="bfiskur" />}
                />
              <MetricCard label="Servicios activos" value={scopedServices.length} icon={Briefcase} accent="blue" helper={attentionServices ? `${attentionServices} requieren tu atención` : "Todos en orden"}
                  footer={<ScopeNote scope={scopeLabel} period="Octubre 2026" source="portal" />}
                />
              <MetricCard label="Entregables de septiembre" value={`${published}/${expected}`} icon={PackageCheck} accent="amber" progress={(published / expected) * 100} helper="Publicados por GS en el portal"
                  footer={<ScopeNote scope={scopeLabel} period="Septiembre 2026" source="portal" />}
                />
              <MetricCard
                  label="Documentos por enviar"
                  value={docsPending}
                  icon={FileClock}
                  accent="pink"
                  href="/documentos"
                  helper={`${docsInReview} en revisión de GS`}
                  footer={<ScopeNote scope={scopeLabel} period="Al 12 oct" source="portal" />}
                />
            </div>

            {(isExec || seesBilling) && (
              <div className={cn("grid gap-3", isExec && seesBilling && "lg:grid-cols-[minmax(0,1fr)_260px]")}>
                {isExec && (
                  <SectionCard
                    title="Indicadores financieros"
                    description="Autorizados para Dirección"
                    icon={TrendingUp}
                    action={
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        Detalle en Contabilidad <PhaseBadge phase={2} />
                      </span>
                    }
                  >
                    <div className="grid gap-5">
                      <dl className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <dt className="text-xs text-muted-foreground">Ingresos ene–ago · cerrado</dt>
                          <dd className="text-2xl font-bold tabular-nums">{formatCompactCurrency(revenueYtd)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Septiembre · preliminar</dt>
                          <dd className="flex items-baseline gap-2">
                            <span className="text-lg font-semibold tabular-nums">{formatCompactCurrency(revenueSep)}</span>
                            <span className="text-xs font-medium text-success">+{formatPercent(revenueSep / revenuePrev - 1, 1)} vs. agosto</span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Margen bruto ene–ago</dt>
                          <dd className="text-lg font-semibold tabular-nums">{formatPercent(margin, 1)}</dd>
                        </div>
                      </dl>
                      {scope === "grupo" ? (
                        <div className="min-w-0">
                          <p className="mb-1 text-xs text-muted-foreground">Ingresos ene–ago por razón social</p>
                          <ChartContainer config={revenueConfig} className="aspect-auto h-44 w-full">
                            <BarChart data={revenueByCompany} layout="vertical" margin={{ left: 0, right: 12 }}>
                              <XAxis type="number" hide />
                              <YAxis type="category" dataKey="empresa" tickLine={false} axisLine={false} width={84} />
                              <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v), 0)} />} />
                              <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={5} barSize={16} />
                            </BarChart>
                          </ChartContainer>
                        </div>
                      ) : (
                        <p className="self-center rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                          Estado de resultados, balance y comparativo por periodo se mostrarán en la página de Contabilidad de esta empresa.
                        </p>
                      )}
                    </div>
                    <ScopeNote
                      scope={scope === "grupo" ? `${scopeLabel} (suma de razones sociales, sin eliminaciones)` : scopeLabel}
                      period="Ene–ago cerrado · sep preliminar"
                      source="contalink"
                      className="mt-3"
                    />
                  </SectionCard>
                )}
                {seesBilling && (
                  <SectionCard title="Saldo con GS" description="Facturas emitidas por GS" icon={Wallet}>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(balanceDue + balanceOverdue)}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Por vencer</span>
                        <span className="tabular-nums">{formatCurrency(balanceDue)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Vencido</span>
                        <span className={cn("tabular-nums", balanceOverdue > 0 && "font-semibold text-destructive")}>{formatCurrency(balanceOverdue)}</span>
                      </p>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      Facturas, aclaraciones y pagos <PhaseBadge phase={3} />
                    </p>
                    <ScopeNote scope={scopeLabel} period="Al 12 oct" source="odoo" className="mt-2" />
                  </SectionCard>
                )}
              </div>
            )}

            {canAccessModule(persona, "servicios") && (
              <SectionCard title="Estado de servicios" icon={Briefcase} action={<PhaseBadge phase={2} className="text-muted-foreground" />} contentClassName="-mx-4 px-0">
                <ul className="divide-y">
                  {scopedServices.map((s) => (
                    <li key={s.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.kind === "recurrente" ? `Periodo: ${s.period}` : s.summary}
                        </p>
                      </div>
                      <div className="flex min-w-0 flex-col text-xs sm:w-64">
                        <span className="text-muted-foreground">Próximo hito · {formatDate(s.nextMilestone.date)}</span>
                        <span className="truncate font-medium">{s.nextMilestone.title}</span>
                      </div>
                      <StatusBadge {...healthMeta[s.scopedHealth]} className="self-start sm:self-center" />
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </Question>

          {/* 5 */}
          {visibleInsights.length > 0 && (
            <Question q="¿Qué conviene revisar o decidir?" title="Análisis de GS" id="q5">
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {visibleInsights.map((i) => (
                  <InsightCard key={i.id} insight={i} />
                ))}
              </div>
            </Question>
          )}
        </div>

        {/* Columna derecha */}
        <div className="min-w-0 space-y-8">
          <Question
            q="¿Qué viene después?"
            title="Próximas fechas"
            id="q4"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/calendario">
                  Calendario
                  <ArrowRight />
                </Link>
              </Button>
            }
          >
            <ul className="divide-y rounded-xl border bg-card">
              {upcoming.map((e) => {
                const [, mon, day] = e.date.split("-")
                const clickable = e.actionItemId && canAccessModule(persona, "pendientes")
                const inner = (
                  <>
                    <span className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-muted py-1 leading-none">
                      <span className="text-[10px] text-muted-foreground uppercase">{formatDate(e.date, { month: "short" })}</span>
                      <span className="text-lg font-bold tabular-nums">{Number(day)}</span>
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block text-sm leading-snug font-medium">{e.title}</span>
                      <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className={cn("size-1.5 rounded-full", eventTypeMeta[e.type].dot)} aria-hidden />
                          {eventTypeMeta[e.type].label}
                        </span>
                        {e.time && <span>{e.time} h</span>}
                        <span>{e.companies.length > 1 ? `${e.companies.length} empresas` : companyShort(e.companies[0])}</span>
                      </span>
                    </span>
                  </>
                )
                return (
                  <li key={`${e.id}-${mon}`}>
                    {clickable ? (
                      <button type="button" onClick={() => setSelected(e.actionItemId!)} className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/50">
                        {inner}
                      </button>
                    ) : (
                      <div className="flex items-start gap-3 px-3 py-2.5">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Question>

          <Question q="¿Qué hizo GS?" title="Lo que hizo GS" id="q3">
            <SectionCard title="Últimos 30 días" icon={BadgeCheck}>
              <div className="mb-4 grid grid-cols-4 gap-2 text-center">
                {(["entregable", "obligacion", "hito", "revision"] as Activity["kind"][]).map((k) => (
                  <div key={k} className="rounded-lg bg-muted/60 px-1 py-2">
                    <p className="text-lg font-bold tabular-nums">{done.filter((a) => a.kind === k).length}</p>
                    <p className="text-[10px] leading-tight text-muted-foreground">{activityLabel[k]}s</p>
                  </div>
                ))}
              </div>
              <ol className="space-y-3">
                {done.slice(0, 5).map((a) => {
                  const Icon = activityIcon[a.kind]
                  const by = getPerson(a.byId)
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        {a.href ? (
                          <Link href={a.href} className="text-sm font-medium hover:underline">
                            {a.title}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium">{a.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {a.detail} · {by.firstName} {by.lastName} · {formatDate(a.date)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
              {nextGs.length > 0 && (
                <div className="mt-4 space-y-2 border-t pt-3">
                  <p className="text-xs font-semibold text-muted-foreground">Próximos pasos de GS</p>
                  {nextGs.map((a) => (
                    <p key={a.id} className="flex items-start gap-2 text-sm">
                      <FileCheck2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1">
                        {a.title}
                        <span className="block text-xs text-muted-foreground">
                          {effectiveStatus(a) === "blocked" ? "Espera un paso previo" : `Antes del ${formatDate(a.dueDate)}`} · {getPerson(a.gsOwnerId).firstName}
                        </span>
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </SectionCard>
          </Question>

          <SectionCard title="Tu contacto en GS" icon={CalendarDays}>
            <PersonChip id={primary.personId} showTitle size="md" />
            <p className="mt-2 text-sm text-muted-foreground">{primary.materia}.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {can.respond && (
                <Button size="sm" asChild>
                  <Link href="/mensajes/nuevo">
                    <MessageSquare />
                    Escribir
                  </Link>
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <Link href="/equipo">Ver equipo</Link>
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>

      <ActionDetailSheet itemId={selected} onClose={() => setSelected(null)} />
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      {state.demo.contalinkDown && <span className="sr-only">Algunas cifras usan la última sincronización válida.</span>}
    </div>
  )
}
