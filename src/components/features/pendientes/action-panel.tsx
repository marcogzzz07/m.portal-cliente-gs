"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Clock, FileSignature, FileUp, Lock, MessageSquare, Receipt, Send, ThumbsUp } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getPerson } from "@/data/organization"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { canActOn, roles } from "@/lib/permissions"
import type { ActionItem } from "@/lib/types"
import { effectiveStatus, usePortal } from "@/store/portal-store"
import { UploadDialog } from "../documentos/upload-dialog"

function Notice({ icon: Icon, title, children, tone = "muted" }: { icon: typeof Clock; title: string; children?: React.ReactNode; tone?: "muted" | "success" | "info" }) {
  const tones = { muted: "bg-muted/70", success: "bg-success/10 text-foreground", info: "bg-info/10" }
  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 ${tones[tone]}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1 text-sm">
        <p className="font-semibold">{title}</p>
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
    </div>
  )
}

/** Acción principal de un pendiente según su tipo, estado y los permisos del usuario. */
export function ActionPanel({ item }: { item: ActionItem }) {
  const { persona, state, approveAction, requestChanges, submitAction } = usePortal()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [changes, setChanges] = useState<string | null>(null)
  const [reply, setReply] = useState("")
  const [date, setDate] = useState("2026-10-21")
  const status = effectiveStatus(item)
  const gs = getPerson(item.gsOwnerId)
  const doc = item.documentId ? state.documents.find((d) => d.id === item.documentId) : undefined

  if (status === "completed") {
    return (
      <Notice icon={CheckCircle2} title="Completado" tone="success">
        {item.completedAt ? `Cerrado el ${formatDateTime(item.completedAt)}.` : null}
      </Notice>
    )
  }
  if (status === "blocked") {
    return (
      <Notice icon={Lock} title="Bloqueado por un paso previo">
        {item.blockedReason}
      </Notice>
    )
  }
  if (status === "upcoming") {
    return (
      <Notice icon={Clock} title={`Disponible a partir del ${item.opensOn ? formatDate(item.opensOn) : "próximo periodo"}`}>
        Te avisaremos cuando se abra. Mientras tanto puedes revisar los requisitos.
      </Notice>
    )
  }
  if (item.owner === "gs" && status !== "changes_required") {
    return (
      <Notice icon={Clock} title="Esperando a GS" tone="info">
        {status === "submitted" ? "Recibimos tu información." : "GS está revisando."} Responsable: {gs.firstName} {gs.lastName}. Respuesta esperada antes del {formatDate(item.dueDate)}.
      </Notice>
    )
  }
  if (!canActOn(persona, item)) {
    const assignee = item.assigneeId ? getPerson(item.assigneeId) : null
    return (
      <Notice icon={Lock} title="Solo lectura para tu rol">
        Tu rol ({roles[persona.role].label}) no permite esta acción.{assignee && ` Asignado a ${assignee.firstName} ${assignee.lastName}.`}
      </Notice>
    )
  }

  switch (item.kind) {
    case "subir":
      return (
        <>
          <Button size="lg" className="w-full" onClick={() => setUploadOpen(true)}>
            <FileUp />
            {doc && doc.versions.length > 0 ? `Subir versión ${doc.versions.length + 1}` : "Subir documento"}
          </Button>
          <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} doc={doc} />
        </>
      )
    case "aprobar":
      if (item.relatedHref)
        return (
          <Button size="lg" className="w-full" asChild>
            <Link href={item.relatedHref}>
              <FileSignature />
              Revisar la propuesta
            </Link>
          </Button>
        )
      return (
        <div className="space-y-3">
          {item.approvalSummary && (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <caption className="border-b bg-muted/60 px-3 py-2 text-left text-xs font-semibold text-muted-foreground">ISR + IVA a pagar · septiembre 2026 · preliminar</caption>
                <tbody>
                  {item.approvalSummary.map((r) => (
                    <tr key={r.label} className="border-b last:border-0">
                      <td className="px-3 py-2">{r.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(r.value, 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40 font-semibold">
                    <td className="px-3 py-2">Total del grupo</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(item.approvalSummary.reduce((s, r) => s + r.value, 0), 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {changes === null ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" onClick={() => setChanges("")}>
                Pedir cambios
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  approveAction(item.id)
                  toast.success("Aprobado", { description: `${gs.firstName} ${gs.lastName} recibió tu aprobación; el siguiente paso de GS quedó desbloqueado.` })
                }}
              >
                <ThumbsUp />
                Aprobar
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="changes">¿Qué debe cambiar?</Label>
              <Textarea id="changes" rows={3} autoFocus value={changes} onChange={(e) => setChanges(e.target.value)} placeholder="Ej. Revisar el IVA acreditable de Comercial antes de aprobar." />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setChanges(null)}>
                  Cancelar
                </Button>
                <Button
                  disabled={!changes.trim()}
                  onClick={() => {
                    requestChanges(item.id, changes.trim())
                    toast.success("Solicitud de cambios enviada", { description: "Quedó registrada en la conversación del pendiente." })
                    setChanges(null)
                  }}
                >
                  <Send />
                  Enviar a GS
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    case "responder":
      return (
        <div className="space-y-2">
          <Label htmlFor="reply">Tu respuesta</Label>
          <Textarea id="reply" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Escribe tu respuesta para ${gs.firstName}…`} />
          <div className="flex flex-wrap justify-end gap-2">
            {item.conversationId && (
              <Button variant="ghost" asChild>
                <Link href={`/mensajes/${item.conversationId}`}>
                  <MessageSquare />
                  Ver conversación
                </Link>
              </Button>
            )}
            <Button
              disabled={!reply.trim()}
              onClick={() => {
                submitAction(item.id, reply.trim())
                toast.success("Respuesta enviada", { description: "Se guardó en la conversación del pendiente." })
                setReply("")
              }}
            >
              <Send />
              Enviar respuesta
            </Button>
          </div>
        </div>
      )
    case "confirmar":
      return (
        <div className="space-y-2">
          <Label htmlFor="confirm-date">Fecha de la cita</Label>
          <Input id="confirm-date" type="date" min="2026-10-12" max={item.dueDate} value={date} onChange={(e) => setDate(e.target.value)} />
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              submitAction(item.id, `Cita confirmada para el ${formatDate(date, { day: "numeric", month: "long" })}.`)
              toast.success("Confirmación enviada a GS")
            }}
          >
            <CheckCircle2 />
            Confirmar
          </Button>
        </div>
      )
    case "pagar":
      return (
        <Button size="lg" className="w-full" asChild>
          <Link href={item.relatedHref ?? "/facturacion"}>
            <Receipt />
            Ver factura y pagar
          </Link>
        </Button>
      )
    case "firmar":
      return (
        <Button size="lg" className="w-full" asChild>
          <Link href={item.relatedHref ?? "/contratos"}>
            <FileSignature />
            Ir a firmar
          </Link>
        </Button>
      )
  }
}
