"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlarmClock, CheckCheck, ChevronRight, Info, Receipt, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs } from "@/components/ui/tabs"
import { AccessDenied } from "@/components/shared/access-denied"
import { EmptyState } from "@/components/shared/empty-state"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { PageTabsList, PageTabsTrigger } from "@/components/shared/page-tabs"
import { StatusBadge } from "@/components/shared/status-badge"
import { useScopedData } from "@/hooks/use-scoped-data"
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format"
import { companyShort } from "@/lib/labels"
import { canAccessModule, matchesScope } from "@/lib/permissions"
import { invoiceStatus as invoiceMeta } from "@/lib/status"
import type { Invoice } from "@/lib/types"
import { cn } from "@/lib/utils"
import { balanceOf, invoiceStatus, paidAmount, useAdmin } from "@/store/admin-store"
import { usePortal } from "@/store/portal-store"
import { PayDialog } from "./pay-dialog"

type View = "por_pagar" | "pagadas" | "todas"

/** Facturación y pagos (Product Spec §15). Odoo es la fuente oficial; el portal no crea una cartera paralela. */
export function BillingView() {
  const router = useRouter()
  const { persona, can, state: portalState } = usePortal()
  const { state } = useAdmin()
  const { scopeBadge } = useScopedData()
  const [view, setView] = useState<View>("por_pagar")
  const [paying, setPaying] = useState<Invoice | null>(null)

  const invoices = useMemo(
    () => state.invoices.filter((i) => matchesScope([i.company], portalState.scope, persona.companies)).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    [state.invoices, portalState.scope, persona.companies]
  )

  if (!canAccessModule(persona, "facturacion")) return <AccessDenied />

  const open = invoices.filter((i) => balanceOf(i) > 0)
  const overdue = open.filter((i) => invoiceStatus(i) === "overdue")
  const soon = open.filter((i) => invoiceStatus(i) === "due_soon")
  const paid2026 = invoices.reduce((s, i) => s + paidAmount(i) - (i.creditNote?.amount ?? 0), 0)
  const list = view === "por_pagar" ? open : view === "pagadas" ? invoices.filter((i) => invoiceStatus(i) === "paid") : invoices

  return (
    <div className="space-y-4">
      <PageHeader icon={Receipt} title="Facturación y pagos" badge={scopeBadge} description="Tu estado de cuenta con GS: facturas, pagos y aclaraciones. Los saldos los confirma Odoo." />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Saldo pendiente" value={formatCompactCurrency(open.reduce((s, i) => s + balanceOf(i), 0))} icon={Wallet} accent="blue" helper={`${open.length} factura${open.length === 1 ? "" : "s"} por pagar`} />
        <MetricCard label="Vencido" value={formatCompactCurrency(overdue.reduce((s, i) => s + balanceOf(i), 0))} icon={AlarmClock} accent="pink" helper={overdue.length ? overdue.map((i) => i.folio).join(", ") : "Nada vencido"} />
        <MetricCard label="Vence en 7 días" value={formatCompactCurrency(soon.reduce((s, i) => s + balanceOf(i), 0))} icon={Receipt} accent="amber" helper={soon.length ? `${soon.length} factura${soon.length === 1 ? "" : "s"}` : "Sin vencimientos próximos"} />
        <MetricCard label="Pagado en 2026" value={formatCompactCurrency(paid2026)} icon={CheckCheck} accent="green" helper="Aplicado en Odoo" />
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)} className="gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <PageTabsList className="lg:w-auto">
            <PageTabsTrigger value="por_pagar">
              Por pagar <span className="ml-2 text-muted-foreground tabular-nums">{open.length}</span>
            </PageTabsTrigger>
            <PageTabsTrigger value="pagadas">Pagadas</PageTabsTrigger>
            <PageTabsTrigger value="todas">Estado de cuenta</PageTabsTrigger>
          </PageTabsList>
          <p className="flex items-center gap-1.5 pb-2 text-[13px] text-muted-foreground">
            <Info className="size-3.5" /> Fuente: Odoo · act. hoy 07:45
          </p>
        </div>

        {list.length === 0 ? (
          <EmptyState icon={CheckCheck} title="Estás al corriente" description="No hay facturas por pagar en este contexto." />
        ) : (
          <div className="overflow-hidden rounded-xl bg-card border">
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Factura</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-0 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((i) => {
                  const st = invoiceStatus(i)
                  return (
                    <TableRow key={i.id} className="cursor-pointer" onClick={() => router.push(`/facturacion/${i.id}`)}>
                      <TableCell className="w-[30%] max-w-0">
                        <p className="truncate font-medium">{i.folio}</p>
                        <p className="truncate text-[13px] text-muted-foreground">{i.concept}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">EcoPack {companyShort(i.company)}</TableCell>
                      <TableCell className={cn("tabular-nums", st === "overdue" ? "font-medium text-destructive" : "text-muted-foreground")}>{formatDate(i.dueDate)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(i.total)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCurrency(balanceOf(i))}</TableCell>
                      <TableCell>
                        <StatusBadge {...invoiceMeta[st]} />
                      </TableCell>
                      <TableCell className="text-right">
                        {can.pay && balanceOf(i) > 0 && st !== "disputed" ? (
                          <Button
                            size="sm"
                            variant={st === "overdue" ? "default" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation()
                              setPaying(i)
                            }}
                          >
                            Pagar
                          </Button>
                        ) : (
                          <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <ul className="divide-y md:hidden">
              {list.map((i) => (
                <li key={i.id}>
                  <Link href={`/facturacion/${i.id}`} className="flex items-start gap-3 px-5 py-4">
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <span className="flex justify-between gap-3">
                        <span className="font-medium">{i.folio}</span>
                        <span className="font-medium tabular-nums">{formatCurrency(balanceOf(i) || i.total)}</span>
                      </span>
                      <span className="block text-[13px] text-muted-foreground">
                        {i.concept} · vence {formatDate(i.dueDate)}
                      </span>
                      <StatusBadge {...invoiceMeta[invoiceStatus(i)]} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Tabs>

      {paying && <PayDialog invoice={paying} open onOpenChange={(v) => !v && setPaying(null)} />}
    </div>
  )
}
