"use client"

import { useState } from "react"
import { CheckCircle2, Copy, CreditCard, FileUp, Landmark, Link2, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Segmented } from "@/components/shared/segmented"
import { formatCurrency } from "@/lib/format"
import { paymentStatus } from "@/lib/status"
import type { Invoice, PaymentMethod } from "@/lib/types"
import { balanceOf, useAdmin } from "@/store/admin-store"

/** Pago simulado: tarjeta, liga o transferencia con comprobante. Odoo confirma la aplicación. */
export function PayDialog({ invoice, open, onOpenChange }: { invoice: Invoice; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state, payInvoice } = useAdmin()
  const live = state.invoices.find((i) => i.id === invoice.id) ?? invoice
  const balance = balanceOf(live)
  const [mode, setMode] = useState<"total" | "parcial">("total")
  const [partial, setPartial] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("tarjeta")
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" })
  const [fail, setFail] = useState(false)
  const [receipt, setReceipt] = useState<string | null>(null)
  const [sentId, setSentId] = useState<string | null>(null)

  const amount = mode === "total" ? balance : Math.min(balance, Number(partial) || 0)
  const cardReady = card.number.replace(/\s/g, "").length >= 15 && card.name.trim() && card.exp.length >= 4 && card.cvv.length >= 3
  const ready = amount > 0 && (method === "tarjeta" ? cardReady : method === "transferencia" ? Boolean(receipt) : true)
  const shown = sentId ? live.payments.find((p) => p.id === sentId) : null
  const link = `https://pagos.gs.ejemplo.mx/l/${live.folio.replace("-", "")}-7Q2K`

  function submit() {
    const id = payInvoice(live.id, { amount, method, receipt: receipt ?? undefined, fail: method === "tarjeta" && fail })
    setSentId(id)
    toast(method === "transferencia" ? "Comprobante enviado" : "Procesando pago…")
  }

  function reset() {
    setSentId(null)
    setReceipt(null)
    setFail(false)
    setCard({ number: "", name: "", exp: "", cvv: "" })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-lg">
        {shown ? (
          <div className="space-y-5 py-2 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
              {shown.status === "applied" ? <CheckCircle2 className="size-7 text-success" /> : shown.status === "failed" ? <XCircle className="size-7 text-destructive" /> : <Loader2 className="size-7 animate-spin text-muted-foreground" />}
            </span>
            <DialogHeader className="items-center">
              <DialogTitle>
                {shown.status === "applied" ? "Pago aplicado" : shown.status === "failed" ? "Pago rechazado" : shown.status === "pending_validation" ? "Comprobante en validación" : "Procesando pago"}
              </DialogTitle>
              <DialogDescription>
                {shown.status === "applied"
                  ? `Odoo confirmó la aplicación de ${formatCurrency(shown.amount)} a la factura ${live.folio}.`
                  : shown.status === "failed"
                    ? shown.failureReason
                    : shown.status === "pending_validation"
                      ? "Contraloría GS valida la transferencia; te avisaremos cuando Odoo la aplique."
                      : "Estamos confirmando la operación con el banco."}
              </DialogDescription>
            </DialogHeader>
            <ol className="mx-auto flex max-w-sm justify-between text-xs">
              {(["initiated", shown.method === "transferencia" ? "pending_validation" : "processing", shown.status === "failed" ? "failed" : "applied"] as const).map((st, i) => {
                const order = ["initiated", "processing", "pending_validation", "applied", "failed"]
                const reached = order.indexOf(shown.status) >= order.indexOf(st) || shown.status === st
                return (
                  <li key={st} className="flex flex-1 flex-col items-center gap-1">
                    <span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${reached ? (st === "failed" ? "bg-destructive text-white" : "bg-primary text-primary-foreground") : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                    <span className={reached ? "font-medium" : "text-muted-foreground"}>{paymentStatus[st].label}</span>
                  </li>
                )
              })}
            </ol>
            <p className="text-xs text-muted-foreground">Referencia {shown.reference}</p>
            <DialogFooter className="sm:justify-center">
              {shown.status === "failed" && (
                <Button variant="outline" onClick={reset}>
                  Intentar de nuevo
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Pagar factura {live.folio}</DialogTitle>
              <DialogDescription>
                Saldo {formatCurrency(balance)} · {live.concept}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label>Monto</Label>
                <Segmented label="Monto" value={mode} onChange={setMode} options={[{ value: "total", label: `Saldo total · ${formatCurrency(balance, 0)}` }, { value: "parcial", label: "Pago parcial" }]} />
                {mode === "parcial" && <Input type="number" min={1} max={balance} value={partial} onChange={(e) => setPartial(e.target.value)} placeholder="Importe a pagar" aria-label="Importe parcial" />}
              </div>

              <div className="grid gap-2">
                <Label>Forma de pago</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { v: "tarjeta", label: "Tarjeta", icon: CreditCard },
                      { v: "liga", label: "Liga de pago", icon: Link2 },
                      { v: "transferencia", label: "Transferencia", icon: Landmark },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.v}
                      type="button"
                      onClick={() => setMethod(m.v)}
                      aria-pressed={method === m.v}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-sm transition-colors ${method === m.v ? "border-brand bg-brand-soft font-medium" : "hover:bg-muted"}`}
                    >
                      <m.icon className="size-4" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {method === "tarjeta" && (
                <div className="grid gap-3 rounded-xl bg-muted p-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="cc-number">Número de tarjeta</Label>
                    <Input id="cc-number" inputMode="numeric" autoComplete="off" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="0000 0000 0000 0000" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="cc-name">Nombre en la tarjeta</Label>
                    <Input id="cc-name" autoComplete="off" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="cc-exp">Vencimiento</Label>
                      <Input id="cc-exp" autoComplete="off" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/AA" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="cc-cvv">CVV</Label>
                      <Input id="cc-cvv" autoComplete="off" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} placeholder="000" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setCard({ number: "4242 4242 4242 4242", name: "PATRICIA RUIZ", exp: "12/29", cvv: "123" })}>
                      Usar tarjeta de prueba
                    </Button>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox checked={fail} onCheckedChange={(v) => setFail(Boolean(v))} />
                      Simular rechazo del banco
                    </label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Prototipo: no se procesa dinero ni se guardan datos de tarjeta.</p>
                </div>
              )}

              {method === "liga" && (
                <div className="space-y-3 rounded-xl bg-muted p-4 text-sm">
                  <p>Comparte la liga con quien autoriza pagos en tu empresa. Al abrirla podrá pagar con tarjeta o SPEI.</p>
                  <div className="flex gap-2">
                    <Input readOnly value={link} className="font-mono text-xs" aria-label="Liga de pago" />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard?.writeText(link).catch(() => undefined)
                        toast.success("Liga copiada")
                      }}
                    >
                      <Copy />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Para la demo, “Pagar” simula que la liga se pagó.</p>
                </div>
              )}

              {method === "transferencia" && (
                <div className="space-y-3 rounded-xl bg-muted p-4 text-sm">
                  <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-1.5">
                    <dt className="text-muted-foreground">Beneficiario</dt>
                    <dd>González Solís (cuenta de ejemplo)</dd>
                    <dt className="text-muted-foreground">Banco</dt>
                    <dd>Banco de demostración</dd>
                    <dt className="text-muted-foreground">CLABE</dt>
                    <dd className="font-mono">000 000 0000 0000 0000</dd>
                    <dt className="text-muted-foreground">Referencia</dt>
                    <dd className="font-mono">{live.folio.replace("-", "")}</dd>
                    <dt className="text-muted-foreground">Importe</dt>
                    <dd className="font-medium">{formatCurrency(amount)}</dd>
                  </dl>
                  <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => setReceipt(`Comprobante_SPEI_${live.folio}.pdf`)}>
                      <FileUp />
                      {receipt ? "Cambiar comprobante" : "Adjuntar comprobante"}
                    </Button>
                    {receipt && <span className="truncate text-xs text-muted-foreground">{receipt}</span>}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button disabled={!ready} onClick={submit}>
                {method === "transferencia" ? "Enviar comprobante" : `Pagar ${formatCurrency(amount)}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
