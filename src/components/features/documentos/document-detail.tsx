"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, BadgeCheck, CheckCircle2, Clock, Download, Eye, FileSignature, FileUp, FlaskConical, Info, ListChecks, MessageSquare, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AccessDenied } from "@/components/shared/access-denied"
import { InfoGrid } from "@/components/shared/info-grid"
import { PersonChip } from "@/components/shared/person-chip"
import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { getPerson, serviceNames } from "@/data/organization"
import { formatDate, formatDateTime, formatRelative } from "@/lib/format"
import { companiesLabel } from "@/lib/labels"
import { canSeeDocument, matchesScope } from "@/lib/permissions"
import type { FileFormat } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"
import { DocIcon, DocStatusBadge, formatMeta } from "./doc-meta"
import { useDocumentDownload } from "./doc-preview-dialog"
import { DocumentPaper } from "./document-paper"
import { UploadDialog } from "./upload-dialog"

/** Detalle de documento: estado de revisión, versiones, metadatos, descargas y conversación contextual. */
export function DocumentDetail({ id }: { id: string }) {
  const router = useRouter()
  const { state, persona, can, reviewDocument, createConversation, setScope } = usePortal()
  const downloadFile = useDocumentDownload()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState<string | null>(null)
  const doc = state.documents.find((d) => d.id === id)

  if (!doc) return <AccessDenied title="Documento no encontrado" description="Es posible que el enlace sea incorrecto o que el documento se haya retirado." />
  if (!canSeeDocument(persona, doc)) return <AccessDenied />

  const outOfScope = !matchesScope(doc.companies, state.scope, persona.companies)
  const conv = doc.conversationId ? state.conversations.find((c) => c.id === doc.conversationId) : undefined
  const action = doc.actionItemId ? state.actionItems.find((a) => a.id === doc.actionItemId) : undefined
  const canUpload = doc.direction === "cliente" && can.upload && doc.status !== "expired" && !doc.signed
  const current = doc.versions.at(-1)
  const seesAudit = persona.role === "admin" || persona.role === "ejecutivo"

  function download(format: FileFormat) {
    downloadFile(doc!, format)
  }

  function talk() {
    if (conv) return router.push(`/mensajes/${conv.id}`)
    const owner = doc!.requestedBy ?? doc!.versions[0]?.uploadedBy ?? "mariana"
    const gsOwner = getPerson(owner).org === "gs" ? owner : "mariana"
    const newId = createConversation(
      { subject: doc!.name, context: { type: "documento", refId: doc!.id, label: `${doc!.name} · ${doc!.period}` }, companies: doc!.companies, service: doc!.service, gsOwnerId: gsOwner },
      `Tengo una duda sobre “${doc!.name}” (${doc!.period}).`
    )
    router.push(`/mensajes/${newId}`)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 sm:hidden">
        <Link href="/documentos">
          <ArrowLeft />
          Documentos
        </Link>
      </Button>

      {outOfScope && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card ring-1 ring-foreground/[0.06] px-5 py-4 text-sm">
          <Info className="size-4 text-info" />
          <span className="flex-1">Este documento pertenece a {companiesLabel(doc.companies)}, fuera del contexto que estás viendo.</span>
          {doc.companies.length === 1 && (
            <Button size="sm" variant="outline" onClick={() => setScope(doc.companies[0])}>
              Cambiar a {companiesLabel(doc.companies)}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <DocIcon doc={doc} className="size-12" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <DocStatusBadge doc={doc} />
            <span className="text-xs text-muted-foreground">
              {doc.id} · {doc.direction === "gs" ? "Entregable de GS" : "Enviado por tu empresa"}
            </span>
          </div>
          <h1 className="text-2xl leading-tight font-bold tracking-tight sm:text-[28px]">{doc.name}</h1>
          <p className="text-sm text-muted-foreground">
            {doc.period} · {companiesLabel(doc.companies)} · {serviceNames[doc.service]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpload && (
            <Button onClick={() => setUploadOpen(true)} variant={doc.status === "changes_required" || doc.status === "requested" ? "default" : "outline"}>
              <FileUp />
              {doc.versions.length ? `Subir versión ${doc.versions.length + 1}` : "Subir documento"}
            </Button>
          )}
          {can.respond && (
            <Button variant="outline" onClick={talk}>
              <MessageSquare />
              {conv ? "Ver conversación" : "Conversar sobre este documento"}
            </Button>
          )}
        </div>
      </div>

      <ReviewCallout docStatus={doc.status} reviewNote={current?.review?.note} requested={!doc.versions.length} instructions={doc.instructions} dueDate={doc.dueDate} reviewer={doc.requestedBy} signed={Boolean(doc.signed)} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {current && doc.direction === "gs" && (
            <SectionCard
              title="Vista previa"
              description={`Versión ${current.version} · ${current.size}`}
              icon={Eye}
              action={
                <div className="flex flex-wrap justify-end gap-2">
                  {doc.formats.map((f, i) => (
                    <Button key={f} size="sm" variant={i === 0 ? "default" : "outline"} onClick={() => download(f)}>
                      <Download />
                      {formatMeta[f].label}
                    </Button>
                  ))}
                </div>
              }
            >
              <div className="max-h-[560px] overflow-y-auto rounded-xl bg-muted/60 p-3 sm:p-6">
                <DocumentPaper doc={doc} />
              </div>
              {doc.signed && (
                <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <FileSignature className="mt-px size-3.5 shrink-0 text-success" />
                  Firmado con {doc.signed.provider} el {formatDateTime(doc.signed.at)} por {doc.signed.by.map((p) => `${getPerson(p).firstName} ${getPerson(p).lastName}`).join(" y ")}. Incluye certificado de firma.
                </p>
              )}
            </SectionCard>
          )}

          {current && doc.direction === "cliente" && (
            <SectionCard title="Archivo vigente" description={`Versión ${current.version} · ${current.size}`} icon={Download}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 flex-1 items-center justify-center rounded-xl bg-muted/60 text-center text-sm text-muted-foreground">
                  <span>
                    <span className="block font-medium text-foreground">{current.fileName}</span>
                    Archivo enviado por tu empresa
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:w-48">
                  {doc.formats.map((f) => (
                    <Button key={f} variant="outline" onClick={() => download(f)} className="justify-start">
                      <Download />
                      Descargar {formatMeta[f].label}
                    </Button>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard title="Historial de versiones" description="Reemplazar crea una versión nueva; nunca se borra la anterior." icon={Clock}>
            {doc.versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay archivos cargados.</p>
            ) : (
              <ol className="space-y-4">
                {[...doc.versions].reverse().map((v) => (
                  <li key={v.version} className={cn("rounded-xl bg-muted/50 p-4", v.version === doc.versions.length && "bg-muted")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[11px] font-bold text-background">v{v.version}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{v.fileName}</span>
                      {v.review ? (
                        <StatusBadge label={v.review.status === "approved" ? "Aprobada" : "Con corrección"} tone={v.review.status === "approved" ? "success" : "danger"} />
                      ) : v.version === doc.versions.length && doc.direction === "cliente" ? (
                        <StatusBadge label={doc.status === "under_review" ? "En revisión" : "Recibida"} tone="info" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {v.size} · {getPerson(v.uploadedBy).firstName} {getPerson(v.uploadedBy).lastName} · {formatDateTime(v.uploadedAt)}
                    </p>
                    {v.note && <p className="mt-2 text-sm">“{v.note}”</p>}
                    {v.review && (
                      <p className={cn("mt-2 flex items-start gap-1.5 text-xs", v.review.status === "approved" ? "text-success" : "text-destructive")}>
                        {v.review.status === "approved" ? <CheckCircle2 className="mt-px size-3.5 shrink-0" /> : <AlertCircle className="mt-px size-3.5 shrink-0" />}
                        <span>
                          {v.review.status === "approved" ? "Aprobada" : "Corrección solicitada"} por {getPerson(v.review.by).firstName} {getPerson(v.review.by).lastName} · {formatDateTime(v.review.at)}
                          {v.review.note && <span className="block text-foreground">{v.review.note}</span>}
                        </span>
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          {(doc.status === "uploaded" || doc.status === "under_review") && doc.direction === "cliente" && (
            <div className="space-y-3 rounded-xl border-2 border-dashed border-foreground/15 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <FlaskConical className="size-4 text-brand" />
                Simular la revisión de GS
                <span className="text-xs font-normal text-muted-foreground">(solo en el prototipo)</span>
              </p>
              {rejectNote === null ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      reviewDocument(doc.id, "approved")
                      toast.success("GS aprobó el documento")
                    }}
                  >
                    <CheckCircle2 />
                    GS aprueba
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectNote("La versión no incluye todas las cuentas solicitadas.")}>
                    GS pide corrección
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea rows={2} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} aria-label="Motivo de la corrección" />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!rejectNote.trim()}
                      onClick={() => {
                        reviewDocument(doc.id, "changes_required", rejectNote.trim())
                        setRejectNote(null)
                        toast("GS pidió una corrección")
                      }}
                    >
                      Enviar corrección
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRejectNote(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <SectionCard title="Datos del documento" icon={Info}>
            <InfoGrid
              columns={1}
              items={[
                { label: "Empresa", value: companiesLabel(doc.companies) },
                { label: "Servicio o proyecto", value: serviceNames[doc.service] },
                { label: "Periodo", value: doc.period },
                { label: "Tipo", value: doc.docType },
                { label: "Visibilidad", value: doc.visibility === "grupo" ? "Usuarios con acceso a la empresa" : "Restringido a usuarios autorizados" },
                ...(doc.requestedBy ? [{ label: "Solicitado por", value: <PersonChip id={doc.requestedBy} /> }] : []),
                ...(doc.dueDate ? [{ label: "Fecha límite", value: formatDate(doc.dueDate, { day: "numeric", month: "long", year: "numeric" }) }] : []),
                ...(doc.publishedAt ? [{ label: "Publicado", value: formatDateTime(doc.publishedAt) }] : []),
                ...(doc.validUntil ? [{ label: "Vigente hasta", value: formatDate(doc.validUntil, { day: "numeric", month: "long", year: "numeric" }) }] : []),
              ]}
            />
            {action && (
              <Button variant="outline" size="sm" asChild className="mt-4 w-full">
                <Link href={`/pendientes/${action.id}`}>
                  <ListChecks />
                  Ver el pendiente relacionado
                </Link>
              </Button>
            )}
          </SectionCard>

          {conv && (
            <SectionCard title="Conversación" description={conv.subject} icon={MessageSquare}>
              <ul className="space-y-3">
                {conv.messages.slice(-2).map((m) => (
                  <li key={m.id} className="space-y-1">
                    <PersonChip id={m.authorId} />
                    <p className="line-clamp-3 text-sm text-muted-foreground">{m.text}</p>
                    <p className="text-[11px] text-muted-foreground">{formatRelative(m.at)}</p>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" asChild className="mt-3 w-full">
                <Link href={`/mensajes/${conv.id}`}>Abrir conversación</Link>
              </Button>
            </SectionCard>
          )}

          {seesAudit && (
            <SectionCard title="Registro de descargas" description="Usuario, versión, formato y fecha" icon={ShieldCheck}>
              {doc.downloads.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nadie ha descargado este documento.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {[...doc.downloads].reverse().map((d, i) => (
                    <li key={`${d.at}-${i}`} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {getPerson(d.personId).firstName} {getPerson(d.personId).lastName}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        v{d.version} · {formatMeta[d.format].label} · {formatDateTime(d.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}
        </div>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} doc={doc} />
    </div>
  )
}

function ReviewCallout({
  docStatus,
  reviewNote,
  requested,
  instructions,
  dueDate,
  reviewer,
  signed,
}: {
  docStatus: string
  reviewNote?: string
  requested: boolean
  instructions?: string
  dueDate?: string
  reviewer?: string
  signed: boolean
}) {
  if (signed) return null
  const who = reviewer ? `${getPerson(reviewer).firstName} ${getPerson(reviewer).lastName}` : "GS"
  const box = "flex items-start gap-3 rounded-2xl px-5 py-4 text-sm"
  switch (docStatus) {
    case "changes_required":
      return (
        <div className={cn(box, "bg-destructive/[0.07]")}>
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Requiere corrección</p>
            <p>{reviewNote}</p>
            <p className="mt-1 text-xs text-muted-foreground">Sube una nueva versión; la anterior se conserva en el historial.</p>
          </div>
        </div>
      )
    case "requested":
      return (
        <div className={cn(box, "bg-[oklch(0.965_0.03_65)]")}>
          <FileUp className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">
              {who} solicitó este documento{dueDate ? ` para el ${formatDate(dueDate, { day: "numeric", month: "long" })}` : ""}
            </p>
            {instructions && <p>{instructions}</p>}
          </div>
        </div>
      )
    case "uploaded":
    case "under_review":
      return (
        <div className={cn(box, "bg-info/[0.08]")}>
          <Clock className="mt-0.5 size-4 shrink-0 text-info" />
          <div>
            <p className="font-semibold">{docStatus === "uploaded" ? "Recibido: pendiente de revisión" : `En revisión por ${who}`}</p>
            <p className="text-muted-foreground">Cargado no significa aprobado. Te avisaremos cuando GS lo apruebe o si necesita una corrección.</p>
          </div>
        </div>
      )
    case "approved":
      return (
        <div className={cn(box, "bg-success/[0.08]")}>
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" />
          <p className="font-semibold">Aprobado por GS. No necesitas hacer nada más.</p>
        </div>
      )
    case "expired":
      return (
        <div className={cn(box, "bg-muted/60")}>
          <Info className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Solicitud vencida</p>
            {requested && instructions && <p className="text-muted-foreground">{instructions}</p>}
          </div>
        </div>
      )
    default:
      return null
  }
}
