"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Circle, Clock, Download, FileSignature, FileText, Lock, MessageSquare, PenLine, ThumbsUp, Users, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { AccessDenied } from "@/components/shared/access-denied"
import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { getPerson } from "@/data/organization"
import { contractContent } from "@/lib/doc-content"
import { downloadContent } from "@/lib/file-export"
import { daysFromToday, formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { canAccessModule } from "@/lib/permissions"
import { contractStatus } from "@/lib/status"
import { cn } from "@/lib/utils"
import { useAdmin } from "@/store/admin-store"
import { usePortal } from "@/store/portal-store"
import { SigningCeremony } from "./signing-ceremony"

/** Detalle de propuesta o contrato: alcance, honorarios, firmantes, historial y acciones. */
export function ContractDetail({ id }: { id: string }) {
  const router = useRouter()
  const { persona, can, state: portalState, createConversation } = usePortal()
  const { state, viewContract, approveContract, requestContractChange, declineContract } = useAdmin()
  const [signing, setSigning] = useState(false)
  const [dialog, setDialog] = useState<"cambio" | "rechazo" | null>(null)
  const [text, setText] = useState("")
  const c = state.contracts.find((x) => x.id === id)

  useEffect(() => {
    if (c) viewContract(c.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.id])

  if (!canAccessModule(persona, "contratos")) return <AccessDenied />
  if (!c) return <AccessDenied title="Documento no encontrado" description="Es posible que el enlace sea incorrecto." />

  const me = persona.personId
  const mySigner = c.signers.find((s) => s.personId === me && s.org === "cliente")
  const openForAction = ["sent", "viewed", "changes_requested", "partially_signed"].includes(c.status)
  const canSign = Boolean(mySigner && mySigner.status === "pendiente" && ["sent", "viewed", "partially_signed"].includes(c.status))
  const approvedByMe = c.approvals.some((a) => a.personId === me)
  const canApprove = can.approve && !approvedByMe && ["sent", "viewed"].includes(c.status)
  const monthly = (c.lines ?? []).filter((l) => l.periodicity === "Mensual").reduce((s, l) => s + l.fee, 0)
  const annual = (c.lines ?? []).filter((l) => l.periodicity === "Anual").reduce((s, l) => s + l.fee, 0)
  const project = (c.lines ?? []).filter((l) => l.periodicity === "Proyecto").reduce((s, l) => s + l.fee, 0)
  const companiesInLines = [...new Set((c.lines ?? []).map((l) => l.company))]
  const conv = c.conversationId ? portalState.conversations.find((x) => x.id === c.conversationId) : undefined

  function clarify() {
    if (conv) return router.push(`/mensajes/${conv.id}`)
    const convId = createConversation(
      { subject: c!.title, context: { type: "contrato", refId: c!.id, label: c!.title }, companies: ["manufactura", "comercial", "logistica", "inmuebles", "servicios"], service: "contabilidad", gsOwnerId: c!.ownerId },
      "Tengo una duda sobre la propuesta antes de aprobarla."
    )
    router.push(`/mensajes/${convId}`)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/contratos">
          <ArrowLeft />
          Propuestas y contratos
        </Link>
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge {...contractStatus[c.status]} />
            <span className="text-[13px] text-muted-foreground">
              {c.kind} · versión {c.version}
              {c.validUntil && openForAction && ` · válida hasta el ${formatDate(c.validUntil, { day: "numeric", month: "long" })} (${daysFromToday(c.validUntil)} días)`}
            </span>
          </div>
          <h1 className="text-2xl leading-tight font-bold tracking-tight sm:text-[28px]">{c.title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{c.summary}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadContent(contractContent(c), c.id)}>
            <Download />
            Descargar
          </Button>
          {openForAction && can.respond && (
            <Button variant="outline" onClick={clarify}>
              <MessageSquare />
              Aclarar
            </Button>
          )}
          {canSign && (
            <Button onClick={() => setSigning(true)}>
              <PenLine />
              Firmar
            </Button>
          )}
        </div>
      </div>

      {c.status === "draft" && (
        <div className="flex items-start gap-3 rounded-2xl bg-muted/70 px-5 py-4 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>Este documento está en preparación. GS espera la validación del notario el 20 de octubre; en cuanto llegue se habilitará la firma de Jorge Salinas.</p>
        </div>
      )}
      {c.status === "changes_requested" && c.changeRequest && (
        <div className="flex items-start gap-3 rounded-2xl bg-[oklch(0.965_0.03_65)] px-5 py-4 text-sm">
          <Clock className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-medium">Cambios solicitados por {getPerson(c.changeRequest.by).firstName}:</span> “{c.changeRequest.text}”. {getPerson(c.ownerId).firstName} enviará una nueva versión.
          </p>
        </div>
      )}
      {c.status === "declined" && (
        <div className="flex items-start gap-3 rounded-2xl bg-destructive/[0.07] px-5 py-4 text-sm">
          <X className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>
            <span className="font-medium">Rechazada.</span> {c.declineReason}
          </p>
        </div>
      )}
      {c.status === "completed" && c.documentId && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-success/[0.08] px-5 py-4 text-sm">
          <CheckCircle2 className="size-4 text-success" />
          <p className="flex-1">Firmado por todos. El documento final y su certificado de firma están guardados.</p>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/documentos/${c.documentId}`}>Ver documento firmado</Link>
          </Button>
        </div>
      )}

      {(canApprove || (openForAction && c.status !== "changes_requested" && (can.approve || canSign))) && (
        <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/[0.06] sm:flex-row sm:items-center">
          <p className="flex-1 text-sm">
            {canSign
              ? "Revisa el alcance y los honorarios. Si estás de acuerdo, firma electrónicamente; si no, solicita un cambio."
              : canApprove
                ? "Como administradora puedes aprobar el contenido para que los firmantes procedan, pedir un cambio o rechazarla."
                : approvedByMe
                  ? "Ya aprobaste el contenido. Los firmantes fueron notificados."
                  : "Puedes solicitar cambios o rechazar la propuesta."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setDialog("rechazo")}>
              Rechazar
            </Button>
            <Button variant="outline" onClick={() => setDialog("cambio")}>
              Solicitar cambio
            </Button>
            {canApprove && (
              <Button
                onClick={() => {
                  approveContract(c.id)
                  toast.success("Propuesta aprobada", { description: "Roberto y Jorge recibieron el aviso para firmar." })
                }}
              >
                <ThumbsUp />
                Aprobar
              </Button>
            )}
            {canSign && (
              <Button onClick={() => setSigning(true)}>
                <PenLine />
                Firmar
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {c.lines && (
            <SectionCard title="Servicios y honorarios" description="Honorarios más IVA" icon={FileText} flush>
              <div className="grid grid-cols-3 gap-4 border-y px-6 py-5">
                <div>
                  <p className="text-[13px] text-muted-foreground">Mensual recurrente</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(monthly, 0)}</p>
                </div>
                <div>
                  <p className="text-[13px] text-muted-foreground">Auditorías (anual)</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(annual, 0)}</p>
                </div>
                <div>
                  <p className="text-[13px] text-muted-foreground">Proyectos y anticipo</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(project, 0)}</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Servicio</TableHead>
                    <TableHead>Alcance</TableHead>
                    <TableHead>Periodicidad</TableHead>
                    <TableHead className="text-right">Honorario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companiesInLines.map((company) => (
                    <CompanyBlock key={company} company={company}>
                      {c.lines!
                        .filter((l) => l.company === company)
                        .map((l, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{l.service}</TableCell>
                            <TableCell className="max-w-0 truncate text-muted-foreground">{l.scope}</TableCell>
                            <TableCell className="text-muted-foreground">{l.periodicity}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatCurrency(l.fee, 0)}</TableCell>
                          </TableRow>
                        ))}
                    </CompanyBlock>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}

          {(c.deliverables || c.exclusions || c.conditions) && (
            <div className="grid gap-4 md:grid-cols-2">
              {c.deliverables && (
                <SectionCard title="Entregables" icon={CheckCircle2}>
                  <ul className="space-y-2 text-sm">
                    {c.deliverables.map((d) => (
                      <li key={d} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-success" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
              {c.exclusions && (
                <SectionCard title="No incluye" icon={X}>
                  <ul className="space-y-2 text-sm">
                    {c.exclusions.map((d) => (
                      <li key={d} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
              {c.conditions && (
                <SectionCard title="Condiciones" icon={FileSignature} className="md:col-span-2">
                  <ul className="grid gap-2 text-sm sm:grid-cols-2">
                    {c.conditions.map((d) => (
                      <li key={d} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <SectionCard title="Firmantes" icon={Users}>
            <ul className="space-y-3">
              {c.signers.map((s) => {
                const p = getPerson(s.personId)
                return (
                  <li key={s.personId} className="flex items-start gap-3">
                    {s.status === "firmado" ? <CheckCircle2 className="mt-0.5 size-4 text-success" /> : s.status === "rechazado" ? <X className="mt-0.5 size-4 text-destructive" /> : <Circle className="mt-0.5 size-4 text-muted-foreground" />}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm", s.personId === persona.personId && "font-semibold")}>
                        {p.firstName} {p.lastName}
                        {s.personId === persona.personId && " (tú)"}
                      </span>
                      <span className="block text-xs text-muted-foreground">{s.capacity}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{s.status === "firmado" && s.signedAt ? formatDate(s.signedAt.slice(0, 10)) : s.status === "rechazado" ? "Rechazó" : "Pendiente"}</span>
                  </li>
                )
              })}
            </ul>
            {c.approvals.length > 0 && (
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                Aprobado internamente por {c.approvals.map((a) => getPerson(a.personId).firstName).join(", ")} · {formatDateTime(c.approvals.at(-1)!.at)}
              </p>
            )}
          </SectionCard>

          {c.advance && c.status !== "completed" && (
            <SectionCard title="Al completar la firma" icon={Clock}>
              <ul className="space-y-2 text-sm">
                <li>• El documento final y el certificado se guardan en Documentos.</li>
                <li>• Se emite la factura del anticipo ({formatCurrency(c.advance * 1.16, 0)} con IVA).</li>
                <li>• Se habilita la incorporación de EcoPack Desarrollos.</li>
              </ul>
            </SectionCard>
          )}

          <SectionCard title="Historial" icon={Clock}>
            <ol className="relative space-y-3 border-l pl-4">
              {[...c.history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`} className="relative">
                  <Circle className="absolute top-1 -left-[21.5px] size-2.5 fill-background text-muted-foreground" />
                  <p className="text-sm">{h.text}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(h.at)}</p>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      </div>

      {signing && <SigningCeremony contract={c} open onOpenChange={setSigning} />}

      <Dialog open={dialog !== null} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === "cambio" ? "Solicitar un cambio" : "Rechazar la propuesta"}</DialogTitle>
            <DialogDescription>{dialog === "cambio" ? `${getPerson(c.ownerId).firstName} recibirá tu solicitud y enviará una nueva versión.` : "GS recibirá el motivo. Podrás pedir una nueva propuesta más adelante."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="ct-text">{dialog === "cambio" ? "¿Qué debe cambiar?" : "Motivo"}</Label>
            <Textarea id="ct-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={dialog === "cambio" ? "Ej. Incluir la auditoría de EcoPack Logística." : "Ej. Lo realizaremos internamente."} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancelar
            </Button>
            <Button
              variant={dialog === "rechazo" ? "destructive" : "default"}
              disabled={!text.trim()}
              onClick={() => {
                if (dialog === "cambio") {
                  requestContractChange(c.id, text.trim())
                  toast.success("Solicitud de cambio enviada")
                } else {
                  declineContract(c.id, text.trim())
                  toast("Propuesta rechazada")
                }
                setText("")
                setDialog(null)
              }}
            >
              {dialog === "cambio" ? "Enviar solicitud" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CompanyBlock({ company, children }: { company: string; children: React.ReactNode }) {
  return (
    <>
      <TableRow className="bg-muted/60 hover:bg-muted/60">
        <TableCell colSpan={4} className="py-2.5 text-[13px] font-medium text-muted-foreground">
          {company}
        </TableCell>
      </TableRow>
      {children}
    </>
  )
}
