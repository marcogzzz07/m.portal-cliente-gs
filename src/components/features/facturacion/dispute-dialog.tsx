"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Invoice } from "@/lib/types"
import { useAdmin } from "@/store/admin-store"

const reasons = ["Importe incorrecto", "Concepto no contratado", "Datos fiscales incorrectos", "Servicio no recibido", "Otro motivo"]

/** Aclaración de factura: queda “En aclaración”, se abre un hilo con Contraloría GS y se pausan los recordatorios. */
export function DisputeDialog({ invoice, open, onOpenChange }: { invoice: Invoice; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { disputeInvoice } = useAdmin()
  const [reason, setReason] = useState(reasons[0])
  const [comment, setComment] = useState("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar aclaración · {invoice.folio}</DialogTitle>
          <DialogDescription>Diana Castro (Contraloría GS) responderá a más tardar el 14 de octubre. Mientras tanto, la factura no te enviará recordatorios de pago.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full data-[size=default]:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="disp-comment">Detalle</Label>
            <Textarea id="disp-comment" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ej. El importe no coincide con la propuesta 2026 para EcoPack Manufactura." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!comment.trim()}
            onClick={() => {
              disputeInvoice(invoice.id, reason, comment.trim())
              toast.success("Aclaración abierta", { description: "Se creó una conversación con Contraloría GS." })
              onOpenChange(false)
              setComment("")
            }}
          >
            Enviar aclaración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
