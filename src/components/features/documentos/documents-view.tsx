"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, FileUp, FolderOpen, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs } from "@/components/ui/tabs"
import { AccessDenied } from "@/components/shared/access-denied"
import { CompanyTag } from "@/components/shared/company-tag"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { PageTabsList, PageTabsTrigger } from "@/components/shared/page-tabs"
import { serviceNames } from "@/data/organization"
import { useScopedData } from "@/hooks/use-scoped-data"
import { dueLabel, formatDate, daysFromToday } from "@/lib/format"
import { canAccessModule } from "@/lib/permissions"
import type { DocumentItem, ServiceKey } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"
import { DocIcon, DocStatusBadge, docView, type DocView } from "./doc-meta"
import { UploadDialog } from "./upload-dialog"

const views: { key: DocView; label: string; empty: string }[] = [
  { key: "pendientes", label: "Pendientes", empty: "No hay documentos solicitados por GS." },
  { key: "enviados", label: "Enviados", empty: "Aún no has enviado documentos en este contexto." },
  { key: "recibidos", label: "Recibidos de GS", empty: "GS todavía no publica entregables en este contexto." },
  { key: "firmados", label: "Firmados", empty: "No hay documentos firmados en este contexto." },
  { key: "archivo", label: "Archivo", empty: "El archivo está vacío." },
]

function lastDate(doc: DocumentItem) {
  return doc.versions.at(-1)?.uploadedAt ?? doc.publishedAt ?? doc.requestedAt ?? ""
}

/** Centro documental (Product Spec §12 y Benchmark): vistas, estados legibles, versiones y búsqueda. */
export function DocumentsView() {
  const router = useRouter()
  const { persona, can } = usePortal()
  const { documents, scopeLabel } = useScopedData()
  const counts = useMemo(() => {
    const c: Record<DocView, number> = { pendientes: 0, enviados: 0, recibidos: 0, firmados: 0, archivo: 0 }
    for (const d of documents) c[docView(d)]++
    return c
  }, [documents])
  const [view, setView] = useState<DocView>(counts.pendientes > 0 ? "pendientes" : "recibidos")
  const [query, setQuery] = useState("")
  const [service, setService] = useState<ServiceKey | "todos">("todos")
  const [uploadFor, setUploadFor] = useState<DocumentItem | null | undefined>(undefined)

  if (!canAccessModule(persona, "documentos")) return <AccessDenied />

  const q = query.trim().toLowerCase()
  const list = documents
    .filter((d) => docView(d) === view)
    .filter((d) => service === "todos" || d.service === service)
    .filter((d) => !q || `${d.name} ${d.period} ${d.docType} ${d.versions.map((v) => v.fileName).join(" ")}`.toLowerCase().includes(q))
    .sort((a, b) =>
      view === "pendientes"
        ? Number(a.status === "expired") - Number(b.status === "expired") || (a.dueDate ?? "").localeCompare(b.dueDate ?? "")
        : lastDate(b).localeCompare(lastDate(a))
    )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FolderOpen}
        title="Documentos"
        description={`Lo que GS te solicita, lo que envías, los entregables de GS y lo firmado de ${scopeLabel}. Cada archivo conserva su historial de versiones.`}
        actions={
          can.upload && (
            <Button onClick={() => setUploadFor(null)}>
              <FileUp />
              Enviar documento
            </Button>
          )
        }
      />

      <Tabs value={view} onValueChange={(v) => setView(v as DocView)} className="gap-4">
        <PageTabsList>
          {views.map((v) => (
            <PageTabsTrigger key={v.key} value={v.key} className="px-3 sm:px-4">
              {v.label}
              <span className={cn("ml-1.5 rounded-full px-1.5 text-[11px] tabular-nums", v.key === "pendientes" && counts.pendientes ? "bg-brand text-white" : "bg-muted text-muted-foreground")}>{counts[v.key]}</span>
            </PageTabsTrigger>
          ))}
        </PageTabsList>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, periodo, tipo o archivo…" className="h-9 bg-card pl-9" aria-label="Buscar documentos" />
          </div>
          <Select value={service} onValueChange={(v) => setService(v as ServiceKey | "todos")}>
            <SelectTrigger className="h-9 w-full bg-card sm:w-52" aria-label="Servicio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los servicios</SelectItem>
              {(["contabilidad", "impuestos", "auditoria", "legal"] as ServiceKey[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {serviceNames[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {list.length === 0 ? (
          <EmptyState icon={FolderOpen} title={q ? `Sin resultados para “${query}”` : "Nada por aquí"} description={q ? "Prueba con otro término." : views.find((v) => v.key === view)!.empty} />
        ) : (
          <>
            {/* Escritorio */}
            <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Documento</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>{view === "pendientes" ? "Fecha límite" : "Última actualización"}</TableHead>
                    <TableHead className="pr-4 text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((d) => (
                    <TableRow key={d.id} className="cursor-pointer" onClick={() => router.push(`/documentos/${d.id}`)}>
                      <TableCell className="pl-4">
                        <span className="flex items-center gap-3">
                          <DocIcon doc={d} />
                          <span className="flex min-w-0 flex-col">
                            <Link href={`/documentos/${d.id}`} className="truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                              {d.name}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {d.period} · {d.docType}
                              {d.versions.length > 1 && ` · v${d.versions.length}`}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-44">
                        <CompanyTag companies={d.companies} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{serviceNames[d.service]}</TableCell>
                      <TableCell>
                        <DocStatusBadge doc={d} />
                      </TableCell>
                      <TableCell className={cn("text-muted-foreground", view === "pendientes" && d.dueDate && daysFromToday(d.dueDate) <= 1 && d.status !== "expired" && "font-semibold text-destructive")}>
                        {view === "pendientes" && d.dueDate ? (d.status === "expired" ? `Cerró el ${formatDate(d.dueDate)}` : `${dueLabel(d.dueDate)}`) : formatDate(lastDate(d).slice(0, 10))}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <RowAction doc={d} onUpload={setUploadFor} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Móvil */}
            <ul className="space-y-2 md:hidden">
              {list.map((d) => (
                <li key={d.id} className="rounded-xl border bg-card p-3">
                  <Link href={`/documentos/${d.id}`} className="flex items-start gap-3">
                    <DocIcon doc={d} />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block font-medium leading-snug">{d.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {d.period} · {serviceNames[d.service]}
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <DocStatusBadge doc={d} />
                        {view === "pendientes" && d.dueDate && d.status !== "expired" && <span className="text-xs font-medium text-destructive">{dueLabel(d.dueDate)}</span>}
                      </span>
                      <CompanyTag companies={d.companies} />
                    </span>
                    <ChevronRight className="mt-1 size-4 text-muted-foreground" />
                  </Link>
                  {view === "pendientes" && can.upload && d.status !== "expired" && (
                    <Button size="sm" className="mt-3 w-full" onClick={() => setUploadFor(d)}>
                      <FileUp />
                      {d.status === "changes_required" ? `Subir versión ${d.versions.length + 1}` : "Subir"}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Tabs>

      <UploadDialog open={uploadFor !== undefined} onOpenChange={(v) => !v && setUploadFor(undefined)} doc={uploadFor ?? undefined} />
    </div>
  )
}

function RowAction({ doc, onUpload }: { doc: DocumentItem; onUpload: (d: DocumentItem) => void }) {
  const { can } = usePortal()
  if (docView(doc) === "pendientes" && doc.status !== "expired" && can.upload) {
    return (
      <Button
        size="sm"
        variant={doc.status === "changes_required" ? "default" : "outline"}
        onClick={(e) => {
          e.stopPropagation()
          onUpload(doc)
        }}
      >
        <FileUp />
        {doc.status === "changes_required" ? `Subir v${doc.versions.length + 1}` : "Subir"}
      </Button>
    )
  }
  return (
    <Button size="sm" variant="ghost" asChild onClick={(e) => e.stopPropagation()}>
      <Link href={`/documentos/${doc.id}`}>
        Ver
        <ChevronRight />
      </Link>
    </Button>
  )
}
