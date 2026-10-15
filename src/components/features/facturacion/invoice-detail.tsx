"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Download, Eye, HelpCircle, MessageSquare, Receipt, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AccessDenied } from "@/components/shared/access-denied"
import { InfoGrid } from "@/components/shared/info-grid"
import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { getCompany, getPerson } from "@/data/organization"
import { daysFromToday, formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { canAccessModule } from "@/lib/permissions"
import { invoiceStatus as invoiceMeta, paymentStatus } from "@/lib/status"
import { balanceOf, invoiceStatus, paidAmount, useAdmin } from "@/store/admin-store"
import { usePortal } from "@/store/portal-store"
import { useDocumentDownload } from "../documentos/doc-preview-dialog"
import { DocumentPaper } from "../documentos/document-paper"
import { DisputeDialog } from "./dispute-dialog"
import { PayDialog } from "./pay-dialog"

const methodLabel = { tarjeta: "Tarjeta", liga: "Liga de pago", transferencia: "Transferencia SPEI" }

/** Detalle de factura: saldo, pagos, aclaración, PDF/XML y acciones de pago. */
export function InvoiceDetail({ id }: { id: string }) {
  const { persona, can, state: portalState } = usePortal()
  const { state } = useAdmin()
  const download = useDocumentDownload()
  const [paying, setPaying] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const inv = state.invoices.find((i) => i.id === id)

  if (!canAccessModule(persona, "facturacion")) return <AccessDenied />
  if (!inv || !persona.companies.includes(inv.company)) return <AccessDenied title="Factura no disponible" description="No existe o no pertenece a las empresas que tienes asignadas." />

  const st = invoiceStatus(inv)
  const balance = balanceOf(inv)
  const doc = portalState.documents.find((d) => d.id === inv.documentId)
  const company = getCompany(inv.company)
  const dispute = inv.dispute

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/facturacion">
          <ArrowLeft />
          Facturación y pagos
        </Link>
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge {...invoiceMeta[st]} />
            <span className="text-[13px] text-muted-foreground">
              {company.name} · emitida el {formatDate(inv.issuedAt.slice(0, 10), { day: "numeric", month: "long" })}
            </span>
          </div>
          <h1 className="text-2xl leading-tight font-bold tracking-tight sm:text-[28px]">Factura {inv.folio}</h1>
          <p className="text-sm text-muted-foreground">{inv.concept}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {doc &&
            doc.formats.map((f) => (
              <Button key={f} variant="outline" onClick={() => download(doc, f)}>
                <Download />
                {f.toUpperCase()}
              </Button>
            ))}
          {balance > 0 && !dispute?.status?.includes("abierta") && can.respond && (
            <Button variant="outline" onClick={() => setDisputing(true)}>
              <HelpCircle />
              Solicitar aclaración
            </Button>
          )}
          {can.pay && balance > 0 && st !== "disputed" && (
            <Button onClick={() => setPaying(true)}>
              <Wallet />
              Pagar {formatCurrency(balance)}
            </Button>
          )}
        </div>
      </div>

      {dispute && (
        <div className={`flex flex-col gap-3 rounded-2xl px-5 py-4 text-sm sm:flex-row sm:items-center ${dispute.status === "abierta" ? "bg-info/[0.08]" : "bg-muted/70"}`}>
          <Clock className="size-4 shrink-0" />
          <p className="flex-1">
            {dispute.status === "abierta" ? (
              <>
                <span className="font-medium">En aclaración: {dispute.reason}.</span> Responsable: {getPerson(dispute.ownerId).firstName} {getPerson(dispute.ownerId).lastName} (Contraloría GS) · respuesta esperada antes del{" "}
                {formatDate(dispute.expectedBy, { day: "numeric", month: "long" })}. Los recordatorios de pago están en pausa; el saldo lo confirma Odoo.
              </>
            ) : (
              <>
                <span className="font-medium">Aclaración resuelta:</span> {dispute.comment} {inv.creditNote && `Se emitió la nota de crédito ${inv.creditNote.folio} por ${formatCurrency(inv.creditNote.amount)}.`}
              </>
            )}
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/mensajes/${dispute.conversationId}`}>
              <MessageSquare />
              Ver conversación
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: formatCurrency(inv.total) },
          { label: "Pagado", value: formatCurrency(paidAmount(inv) - (inv.creditNote?.amount ?? 0)) },
          { label: "Notas de crédito", value: formatCurrency(inv.creditNote?.amount ?? 0) },
          { label: "Saldo", value: formatCurrency(balance), strong: true },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-card px-6 py-5 ring-1 ring-foreground/[0.06]">
            <p className="text-[13px] text-muted-foreground">{k.label}</p>
            <p className={`mt-1 text-2xl tracking-tight tabular-nums ${k.strong ? "font-bold" : "font-semibold"}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <SectionCard title="Pagos" description="Cada pago se aplica cuando Odoo lo confirma" icon={Receipt} flush>
            {inv.payments.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">Aún no hay pagos registrados para esta factura.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Forma de pago</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...inv.payments].reverse().map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground tabular-nums">{formatDateTime(p.at)}</TableCell>
                      <TableCell>{methodLabel[p.method]}</TableCell>
                      <TableCell className="font-mono text-[13px] text-muted-foreground">{p.reference}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>
                        <StatusBadge {...paymentStatus[p.status]} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>

          {doc && (
            <SectionCard title="Vista previa" icon={Eye}>
              <div className="max-h-[520px] overflow-y-auto rounded-xl bg-muted/60 p-3 sm:p-6">
                <DocumentPaper doc={doc} />
              </div>
            </SectionCard>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <SectionCard title="Datos de la factura" icon={Receipt}>
            <InfoGrid
              columns={1}
              items={[
                { label: "Receptor", value: `${company.legalName}` },
                { label: "RFC", value: company.rfc },
                { label: "Periodo facturado", value: inv.period },
                { label: "Emisión", value: formatDate(inv.issuedAt.slice(0, 10), { day: "numeric", month: "long", year: "numeric" }) },
                {
                  label: "Vencimiento",
                  value: `${formatDate(inv.dueDate, { day: "numeric", month: "long", year: "numeric" })}${balance > 0 ? ` (${daysFromToday(inv.dueDate) < 0 ? `venció hace ${-daysFromToday(inv.dueDate)} días` : `en ${daysFromToday(inv.dueDate)} días`})` : ""}`,
                },
                { label: "Método de pago", value: "PPD · pago diferido" },
              ]}
            />
          </SectionCard>
          <SectionCard title="¿Dudas sobre esta factura?" icon={HelpCircle}>
            <p className="text-sm text-muted-foreground">Diana Castro, de Contraloría GS, atiende aclaraciones de facturas y pagos.</p>
          </SectionCard>
        </div>
      </div>

      {paying && <PayDialog invoice={inv} open onOpenChange={setPaying} />}
      <DisputeDialog invoice={inv} open={disputing} onOpenChange={setDisputing} />
    </div>
  )
}
