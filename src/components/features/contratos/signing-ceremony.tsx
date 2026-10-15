"use client"

import { useState } from "react"
import Link from "next/link"
import { Dancing_Script } from "next/font/google"
import { CheckCircle2, Loader2, Lock, PenLine, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BrandMark } from "@/components/layout/brand-logo"
import { getPerson } from "@/data/organization"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Contract } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAdmin } from "@/store/admin-store"
import { usePortal } from "@/store/portal-store"

const script = Dancing_Script({ subsets: ["latin"], weight: ["600"] })

type Step = "codigo" | "revisar" | "firmar" | "listo"

/**
 * Firma embebida simulada (Benchmark: DocuSign como ceremonia, el portal conserva el contexto).
 * Código de acceso → revisión y consentimiento → adoptar firma → firmar → confirmación.
 */
export function SigningCeremony({ contract, open, onOpenChange }: { contract: Contract; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { persona } = usePortal()
  const { state, signContract } = useAdmin()
  const me = getPerson(persona.personId)
  const live = state.contracts.find((c) => c.id === contract.id) ?? contract
  const signer = live.signers.find((s) => s.personId === persona.personId)
  const [step, setStep] = useState<Step>("codigo")
  const [code, setCode] = useState("")
  const [consent, setConsent] = useState(false)
  const [name, setName] = useState(`${me.firstName} ${me.lastName}`)
  const [placed, setPlaced] = useState(false)

  const total = (live.lines ?? []).reduce((s, l) => s + (l.periodicity === "Mensual" ? l.fee * 12 : l.fee), 0)
  const steps: { key: Step; label: string }[] = [
    { key: "codigo", label: "Verificar" },
    { key: "revisar", label: "Revisar" },
    { key: "firmar", label: "Firmar" },
    { key: "listo", label: "Listo" },
  ]
  const idx = steps.findIndex((s) => s.key === step)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && step !== "listo") setStep("codigo")
        onOpenChange(v)
      }}
    >
      <DialogContent className="flex h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl" showCloseButton={step !== "firmar"}>
        {/* Barra superior del proveedor de firma */}
        <div className="flex flex-wrap items-center gap-3 border-b bg-[oklch(0.22_0.01_264)] px-5 py-3 pr-12 text-white">
          <ShieldCheck className="size-4 text-emerald-400" />
          <DialogTitle className="text-sm font-medium text-white">Firma electrónica segura</DialogTitle>
          <DialogDescription className="text-xs text-white/60">Proveedor: DocuSign (simulado) · Sesión cifrada</DialogDescription>
          <ol className="ml-auto hidden items-center gap-2 text-xs sm:flex">
            {steps.map((s, i) => (
              <li key={s.key} className={cn("flex items-center gap-1.5", i <= idx ? "text-white" : "text-white/40")}>
                <span className={cn("flex size-5 items-center justify-center rounded-full text-[10px] font-bold", i < idx ? "bg-emerald-500" : i === idx ? "bg-white text-black" : "bg-white/15")}>{i < idx ? "✓" : i + 1}</span>
                {s.label}
              </li>
            ))}
          </ol>
        </div>

        {step === "codigo" && (
          <div className="flex flex-1 items-center justify-center bg-muted/40 p-6">
            <div className="w-full max-w-sm space-y-5 rounded-2xl bg-card p-7 ring-1 ring-foreground/[0.06]">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Lock className="size-5" />
              </span>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Verifica tu identidad</h3>
                <p className="text-sm text-muted-foreground">Enviamos un código de acceso a {me.email}.</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sign-code">Código de acceso</Label>
                <Input id="sign-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className="h-11 text-center text-lg tracking-[0.4em]" />
                <button type="button" className="text-left text-xs text-muted-foreground hover:text-foreground" onClick={() => setCode("482913")}>
                  Demo: el código es <span className="font-mono font-medium text-foreground">482913</span> (clic para usarlo)
                </button>
              </div>
              <Button className="w-full" disabled={code !== "482913"} onClick={() => setStep("revisar")}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {(step === "revisar" || step === "firmar") && (
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-h-0 overflow-y-auto bg-muted/60 p-4 sm:p-8">
              <article className="mx-auto max-w-[680px] space-y-5 rounded-lg bg-white px-8 py-9 text-[13px] leading-relaxed text-neutral-800 shadow-sm ring-1 ring-black/5 sm:px-12">
                <header className="flex items-center gap-3 border-b pb-4">
                  <BrandMark />
                  <div>
                    <p className="text-[11px] tracking-wide text-neutral-500 uppercase">González Solís</p>
                    <h3 className="text-base font-semibold text-neutral-900">{live.title}</h3>
                  </div>
                </header>
                <p>
                  Este documento formaliza la contratación de los servicios descritos para {live.companies.join(", ")}, con vigencia del{" "}
                  {live.startDate ? formatDate(live.startDate, { day: "numeric", month: "long", year: "numeric" }) : "inicio acordado"} al{" "}
                  {live.endDate ? formatDate(live.endDate, { day: "numeric", month: "long", year: "numeric" }) : "término acordado"}.
                </p>
                {live.lines && (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b text-neutral-500">
                        <th className="py-1.5 text-left font-medium">Empresa y servicio</th>
                        <th className="py-1.5 text-right font-medium">Honorario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {live.lines.map((l, i) => (
                        <tr key={i} className="border-b border-neutral-100">
                          <td className="py-1">
                            {l.company} · {l.service}
                          </td>
                          <td className="py-1 text-right tabular-nums">
                            {formatCurrency(l.fee, 0)} {l.periodicity === "Mensual" ? "/ mes" : l.periodicity === "Anual" ? "/ año" : "único"}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-semibold">
                        <td className="py-2">Total estimado del primer año, más IVA</td>
                        <td className="py-2 text-right tabular-nums">{formatCurrency(total, 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
                {live.conditions?.map((c) => (
                  <p key={c}>• {c}</p>
                ))}
                <div className="grid gap-6 pt-6 sm:grid-cols-2">
                  {live.signers.map((s) => {
                    const p = getPerson(s.personId)
                    const isMe = s.personId === persona.personId
                    return (
                      <div key={s.personId} className="space-y-1">
                        <div className="relative flex h-16 items-end border-b border-neutral-400">
                          {s.status === "firmado" ? (
                            <span className={cn(script.className, "text-3xl text-[oklch(0.3_0.1_260)]")}>
                              {p.firstName} {p.lastName}
                            </span>
                          ) : isMe && step === "firmar" ? (
                            placed ? (
                              <span className={cn(script.className, "text-3xl text-[oklch(0.3_0.1_260)]")}>{name}</span>
                            ) : (
                              <button type="button" onClick={() => setPlaced(true)} className="mb-2 flex animate-pulse items-center gap-1.5 rounded-md bg-amber-300 px-3 py-1.5 text-xs font-bold text-amber-950 shadow hover:animate-none">
                                <PenLine className="size-3.5" />
                                Firmar aquí
                              </button>
                            )
                          ) : null}
                        </div>
                        <p className="font-medium text-neutral-900">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-[11px] text-neutral-500">{s.capacity}</p>
                      </div>
                    )
                  })}
                </div>
              </article>
            </div>

            <aside className="space-y-5 overflow-y-auto border-l bg-card p-5">
              {step === "revisar" ? (
                <>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Revisa el documento</h3>
                    <p className="text-sm text-muted-foreground">Lee el contenido completo antes de firmar. Tu firma tendrá el mismo efecto que una firma autógrafa.</p>
                  </div>
                  <label className="flex items-start gap-2.5 rounded-xl bg-muted/60 p-3 text-sm">
                    <Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} className="mt-0.5" />
                    Acepto usar registros y firmas electrónicas para este documento.
                  </label>
                  <Button className="w-full" disabled={!consent} onClick={() => setStep("firmar")}>
                    Continuar a firmar
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Adopta tu firma</h3>
                    <p className="text-sm text-muted-foreground">Confirma tu nombre y da clic en la etiqueta amarilla “Firmar aquí”.</p>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="sign-name">Nombre completo</Label>
                    <Input id="sign-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="rounded-xl border border-dashed p-4 text-center">
                    <p className="text-[11px] text-muted-foreground">Vista previa</p>
                    <p className={cn(script.className, "text-3xl text-[oklch(0.3_0.1_260)]")}>{name || " "}</p>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!placed || !name.trim()}
                    onClick={() => {
                      signContract(live.id, name.trim())
                      setStep("listo")
                    }}
                  >
                    Finalizar firma
                  </Button>
                  {!placed && <p className="text-xs text-muted-foreground">Falta colocar tu firma en el documento.</p>}
                </>
              )}
            </aside>
          </div>
        )}

        {step === "listo" && (
          <div className="flex flex-1 items-center justify-center overflow-y-auto bg-muted/40 p-6">
            <div className="w-full max-w-lg space-y-5 rounded-2xl bg-card p-7 text-center ring-1 ring-foreground/[0.06]">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
                <CheckCircle2 className="size-7" />
              </span>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{live.status === "completed" ? "Firma completada" : "Firmaste el documento"}</h3>
                <p className="text-sm text-muted-foreground">
                  {live.status === "completed" ? "Todos los firmantes firmaron. El documento final y su certificado ya están en el portal." : "Esperando a los demás firmantes…"}
                </p>
              </div>
              <ul className="space-y-2 text-left text-sm">
                {live.signers.map((s) => {
                  const p = getPerson(s.personId)
                  return (
                    <li key={s.personId} className="flex items-center gap-3 rounded-xl bg-muted/60 px-4 py-2.5">
                      {s.status === "firmado" ? <CheckCircle2 className="size-4 text-success" /> : <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                      <span className="flex-1">
                        {p.firstName} {p.lastName} <span className="text-muted-foreground">· {s.capacity}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{s.status === "firmado" ? "Firmó" : "Pendiente"}</span>
                    </li>
                  )
                })}
              </ul>
              {live.status === "completed" && (
                <div className="space-y-2 rounded-xl bg-success/[0.08] p-4 text-left text-sm">
                  <p className="font-medium">Lo que sigue</p>
                  <p>• El contrato firmado está en Documentos › Firmados.</p>
                  {live.advance && <p>• Se emitió la factura A-4830 por el anticipo del alta de EcoPack Desarrollos.</p>}
                  {live.advance && <p>• Se habilitó la incorporación de EcoPack Desarrollos.</p>}
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                {live.status === "completed" && live.advance && (
                  <Button variant="outline" asChild>
                    <Link href="/onboarding">Ir a la incorporación</Link>
                  </Button>
                )}
                <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
              </div>
              {signer?.signedAt && <p className="text-xs text-muted-foreground">Firmado el {signer.signedAt.replace("T", " a las ")} · Registro de auditoría guardado.</p>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
