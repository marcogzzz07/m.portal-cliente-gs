"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Clock, Download, Eye, FileUp, FolderOpen, PackageCheck, Receipt, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs } from "@/components/ui/tabs"
import { AccessDenied } from "@/components/shared/access-denied"
import { EmptyState } from "@/components/shared/empty-state"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { PageTabsList, PageTabsTrigger } from "@/components/shared/page-tabs"
import { Segmented } from "@/components/shared/segmented"
import { serviceNames } from "@/data/organization"
import { useScopedData } from "@/hooks/use-scoped-data"
import { daysFromToday, dueLabel, formatCurrency, formatDate } from "@/lib/format"
import { companiesLabel } from "@/lib/labels"
import { canAccessModule } from "@/lib/permissions"
import type { DocumentItem, ServiceKey } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"
import { DocStatusBadge, docView, formatMeta, type DocView } from "./doc-meta"
import { DocPreviewDialog, useDocumentDownload } from "./doc-preview-dialog"
import { UploadDialog } from "./upload-dialog"

const views: { key: DocView; label: string; empty: string }[] = [
  { key: "pendientes", label: "Pendientes", empty: "No hay documentos solicitados por GS." },
  { key: "recibidos", label: "Entregables de GS", empty: "GS todavía no publica entregables en este contexto." },
  { key: "enviados", label: "Enviados", empty: "Aún no has enviado documentos en este contexto." },
  { key: "facturas", label: "Facturas de GS", empty: "No hay facturas de GS en este contexto." },
  { key: "firmados", label: "Firmados", empty: "No hay documentos firmados en este contexto." },
  { key: "archivo", label: "Archivo", empty: "El archivo está vacío." },
]

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const MONTHS_LONG = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
const PAGE = 40

function lastDate(doc: DocumentItem) {
  return doc.versions.at(-1)?.uploadedAt ?? doc.publishedAt ?? doc.requestedAt ?? ""
}

function periodKeyOf(doc: DocumentItem) {
  return doc.periodKey ?? lastDate(doc).slice(0, 7)
}

function groupLabel(key: string) {
  const [y, m] = key.split("-").map(Number)
  return `${MONTHS_LONG[m - 1]} ${y}`
}

/** Centro documental (Product Spec §12): solicitudes, envíos y el repositorio histórico de entregables de GS. */
export function DocumentsView() {
  const router = useRouter()
  const { persona, can } = usePortal()
  const { documents, scopeBadge } = useScopedData()
  const download = useDocumentDownload()
  const counts = useMemo(() => {
    const c: Record<DocView, number> = { pendientes: 0, enviados: 0, recibidos: 0, facturas: 0, firmados: 0, archivo: 0 }
    for (const d of documents) c[docView(d)]++
    return c
  }, [documents])
  const [view, setView] = useState<DocView>("recibidos")
  const [query, setQuery] = useState("")
  const [service, setService] = useState<ServiceKey | "todos">("todos")
  const [docType, setDocType] = useState("todos")
  const [month, setMonth] = useState<string>("todos")
  const [limit, setLimit] = useState(PAGE)
  const [uploadFor, setUploadFor] = useState<DocumentItem | null | undefined>(undefined)
  const [preview, setPreview] = useState<DocumentItem | null>(null)

  const inView = useMemo(() => documents.filter((d) => docView(d) === view), [documents, view])
  const repository = view === "recibidos" || view === "enviados" || view === "facturas"
  const monthCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const d of inView) {
      if (service !== "todos" && d.service !== service) continue
      const k = periodKeyOf(d)
      c[k] = (c[k] ?? 0) + 1
    }
    return c
  }, [inView, service])
  const types = useMemo(() => [...new Set(inView.map((d) => d.docType))].sort(), [inView])

  if (!canAccessModule(persona, "documentos")) return <AccessDenied />

  function changeView(v: DocView) {
    setView(v)
    setMonth("todos")
    setDocType("todos")
    setService("todos")
    setLimit(PAGE)
  }

  const q = query.trim().toLowerCase()
  const list = inView
    .filter((d) => service === "todos" || d.service === service)
    .filter((d) => docType === "todos" || d.docType === docType)
    .filter((d) => month === "todos" || periodKeyOf(d) === month)
    .filter((d) => !q || `${d.name} ${d.period} ${d.docType} ${d.folio ?? ""} ${d.versions.map((v) => v.fileName).join(" ")}`.toLowerCase().includes(q))
    .sort((a, b) =>
      view === "pendientes"
        ? Number(a.status === "expired") - Number(b.status === "expired") || (a.dueDate ?? "").localeCompare(b.dueDate ?? "")
        : periodKeyOf(b).localeCompare(periodKeyOf(a)) || lastDate(b).localeCompare(lastDate(a))
    )
  const shown = list.slice(0, limit)
  const groups = repository || view === "archivo" ? [...new Set(shown.map(periodKeyOf))].map((k) => ({ key: k, items: shown.filter((d) => periodKeyOf(d) === k) })) : [{ key: "", items: shown }]
  const showAmount = view === "facturas"

  return (
    <div className="space-y-4">
      <PageHeader
        icon={FolderOpen}
        title="Documentos"
        badge={scopeBadge}
        description="Todo lo que GS te ha entregado, lo que envías y lo que GS te solicita. Cada archivo conserva su historial de versiones."
        actions={
          can.upload && (
            <Button onClick={() => setUploadFor(null)}>
              <FileUp />
              Enviar documento
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Entregables de GS" value={counts.recibidos} icon={PackageCheck} accent="blue" helper="Publicados en 2026" />
        <MetricCard label="Por enviar" value={documents.filter((d) => d.direction === "cliente" && (d.status === "requested" || d.status === "changes_required")).length} icon={FileUp} accent="pink" helper="Solicitados por GS o con corrección" />
        <MetricCard label="En revisión de GS" value={documents.filter((d) => d.direction === "cliente" && (d.status === "uploaded" || d.status === "under_review")).length} icon={Clock} accent="amber" helper="Cargado no significa aprobado" />
        {canAccessModule(persona, "facturacion") ? (
          <MetricCard label="Facturas de GS" value={counts.facturas} icon={Receipt} accent="green" helper="PDF y XML disponibles" />
        ) : (
          <MetricCard label="Enviados por tu empresa" value={counts.enviados} icon={FolderOpen} accent="green" helper="Con su revisión de GS" />
        )}
      </div>

      <Tabs value={view} onValueChange={(v) => changeView(v as DocView)} className="gap-5">
        <PageTabsList>
          {views
            .filter((v) => counts[v.key] > 0 || v.key === "pendientes" || v.key === "recibidos")
            .map((v) => (
              <PageTabsTrigger key={v.key} value={v.key}>
                {v.label}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground tabular-nums">{counts[v.key]}</span>
              </PageTabsTrigger>
            ))}
        </PageTabsList>

        {repository && (
          <div className="rounded-xl border bg-card px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Periodo · 2026</p>
              <button type="button" onClick={() => setMonth("todos")} className={cn("text-sm text-muted-foreground hover:text-foreground", month === "todos" && "font-medium text-foreground")}>
                Todo el año
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
              {MONTHS.map((label, i) => {
                const k = `2026-${String(i + 1).padStart(2, "0")}`
                const n = monthCounts[k] ?? 0
                const active = month === k
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={n === 0}
                    onClick={() => {
                      setMonth(active ? "todos" : k)
                      setLimit(PAGE)
                    }}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[13px] transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent",
                      n === 0 && "cursor-default opacity-40 hover:bg-muted"
                    )}
                  >
                    <span className="font-medium">{label}</span>
                    <span className={cn("text-[11px] tabular-nums", active ? "text-primary-foreground/70" : "text-muted-foreground")}>{n || "—"}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Barra de herramientas integrada a la tabla: comparten una sola frontera. */}
        <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-2 border-b px-4 py-2.5 lg:flex-row lg:items-center">
          {view === "recibidos" && (
            <Segmented
              label="Servicio"
              value={service}
              onChange={(v) => {
                setService(v)
                setLimit(PAGE)
              }}
              options={[
                { value: "todos", label: "Todos" },
                { value: "contabilidad", label: "Contabilidad" },
                { value: "impuestos", label: "Impuestos" },
                { value: "auditoria", label: "Auditoría" },
                { value: "legal", label: "Legal" },
              ]}
              className="max-w-full overflow-x-auto"
            />
          )}
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
            <div className="relative sm:max-w-[28rem] sm:flex-1">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, folio o archivo…" className="h-8 pl-8 text-[13px] md:text-[13px]" aria-label="Buscar documentos" />
            </div>
            {types.length > 1 && (
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-full sm:w-48" aria-label="Tipo de documento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={FolderOpen} title={q ? `Sin resultados para “${query}”` : "Nada por aquí"} description={q ? "Prueba con otro término." : views.find((v) => v.key === view)!.empty} />
          </div>
        ) : (
          <div>
            {/* Escritorio */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Documento</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>{showAmount ? "Importe" : "Servicio"}</TableHead>
                  <TableHead>{view === "pendientes" ? "Fecha límite" : view === "enviados" ? "Enviado" : "Publicado"}</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-0 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <GroupBlock key={g.key || "all"} label={g.key ? groupLabel(g.key) : ""} count={g.items.length}>
                    {g.items.map((d) => (
                      <TableRow key={d.id} className="cursor-pointer" onClick={() => router.push(`/documentos/${d.id}`)}>
                        <TableCell className="w-[38%] max-w-0">
                          <Link href={`/documentos/${d.id}`} className="block truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                            {d.name}
                          </Link>
                          <span className="block truncate text-xs text-muted-foreground">
                            {d.period} · {d.formats.map((f) => formatMeta[f].label).join(", ")}
                            {d.versions.length > 1 && ` · versión ${d.versions.length}`}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{companiesLabel(d.companies)}</TableCell>
                        <TableCell className={cn("text-muted-foreground", showAmount && "tabular-nums")}>{showAmount ? formatCurrency(d.amount ?? 0) : serviceNames[d.service]}</TableCell>
                        <TableCell className={cn("text-muted-foreground tabular-nums", view === "pendientes" && d.dueDate && daysFromToday(d.dueDate) <= 1 && d.status !== "expired" && "font-medium text-destructive")}>
                          {view === "pendientes" && d.dueDate ? (d.status === "expired" ? `Cerró el ${formatDate(d.dueDate)}` : formatDate(d.dueDate)) : formatDate(lastDate(d).slice(0, 10))}
                        </TableCell>
                        <TableCell>
                          <DocStatusBadge doc={d} />
                        </TableCell>
                        <TableCell className="text-right">
                          <RowActions doc={d} onUpload={setUploadFor} onPreview={setPreview} onDownload={download} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </GroupBlock>
                ))}
              </TableBody>
            </Table>

            {/* Móvil */}
            <ul className="divide-y md:hidden">
              {groups.flatMap((g) => [
                ...(g.key ? [<li key={`h-${g.key}`} className="bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground">{groupLabel(g.key)}</li>] : []),
                ...g.items.map((d) => (
                  <li key={d.id} className="flex items-start gap-3 px-4 py-3">
                    <Link href={`/documentos/${d.id}`} className="min-w-0 flex-1 space-y-1.5">
                      <span className="block font-medium leading-snug">{d.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {companiesLabel(d.companies)} · {showAmount ? formatCurrency(d.amount ?? 0) : d.period}
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <DocStatusBadge doc={d} />
                        {view === "pendientes" && d.dueDate && d.status !== "expired" && <span className="text-xs font-medium text-destructive">{dueLabel(d.dueDate)}</span>}
                      </span>
                    </Link>
                    {d.status === "completed" || d.status === "approved" ? (
                      <Button variant="ghost" size="icon-sm" onClick={() => setPreview(d)} aria-label={`Ver ${d.name}`}>
                        <Eye />
                      </Button>
                    ) : view === "pendientes" && can.upload && d.status !== "expired" ? (
                      <Button size="sm" onClick={() => setUploadFor(d)}>
                        Subir
                      </Button>
                    ) : (
                      <ChevronRight className="mt-1 size-4 text-muted-foreground" />
                    )}
                  </li>
                )),
              ])}
            </ul>

            {list.length > limit && (
              <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">
                  Mostrando {limit} de {list.length}
                </span>
                <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
                  Mostrar más
                </Button>
              </div>
            )}
          </div>
        )}
        </div>
      </Tabs>

      <UploadDialog open={uploadFor !== undefined} onOpenChange={(v) => !v && setUploadFor(undefined)} doc={uploadFor ?? undefined} />
      <DocPreviewDialog doc={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

function GroupBlock({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
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

function RowActions({
  doc,
  onUpload,
  onPreview,
  onDownload,
}: {
  doc: DocumentItem
  onUpload: (d: DocumentItem) => void
  onPreview: (d: DocumentItem) => void
  onDownload: (d: DocumentItem, f: DocumentItem["formats"][number]) => void
}) {
  const { can } = usePortal()
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    fn()
  }
  if (docView(doc) === "pendientes" && doc.status !== "expired" && can.upload) {
    return (
      <Button size="sm" variant={doc.status === "changes_required" ? "default" : "outline"} onClick={stop(() => onUpload(doc))}>
        <FileUp />
        {doc.status === "changes_required" ? `Subir v${doc.versions.length + 1}` : "Subir"}
      </Button>
    )
  }
  if (doc.versions.length === 0) return <ChevronRight className="ml-auto size-4 text-muted-foreground" />
  return (
    <span className="inline-flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={stop(() => onPreview(doc))} aria-label={`Vista previa de ${doc.name}`}>
        <Eye />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={stop(() => onDownload(doc, doc.formats[0]))} aria-label={`Descargar ${doc.name}`}>
        <Download />
      </Button>
    </span>
  )
}
