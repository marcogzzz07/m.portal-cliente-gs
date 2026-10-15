"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarClock, CheckCircle2, Circle, FileUp, Loader2, Lock, Paperclip, Rocket, Save, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AccessDenied } from "@/components/shared/access-denied"
import { InfoGrid } from "@/components/shared/info-grid"
import { PageHeader } from "@/components/shared/page-header"
import { PersonChip } from "@/components/shared/person-chip"
import { StatusBadge } from "@/components/shared/status-badge"
import { onboardingCompany } from "@/data/admin"
import { getPerson } from "@/data/organization"
import { daysFromToday, formatCurrency, formatDate } from "@/lib/format"
import { canAccessModule, roles } from "@/lib/permissions"
import { onboardingStatus } from "@/lib/status"
import type { OnboardingStep } from "@/lib/types"
import { cn } from "@/lib/utils"
import { balanceOf, useAdmin } from "@/store/admin-store"
import { usePortal } from "@/store/portal-store"
import { ScheduleMeetingDialog } from "../equipo/schedule-meeting-dialog"
import { PayDialog } from "../facturacion/pay-dialog"

const done = (s: OnboardingStep) => s.status === "completed" || s.status === "approved"

/** Onboarding (Product Spec §14): checklist adaptable con responsable, vencimiento, requisitos y criterio de validación. */
export function OnboardingView() {
  const { persona } = usePortal()
  const { state } = useAdmin()
  const firstOpen = state.onboarding.find((s) => !done(s) && s.status !== "locked")
  const [selected, setSelected] = useState(firstOpen?.id ?? "OB-4")

  if (!canAccessModule(persona, "onboarding")) return <AccessDenied />

  const steps = state.onboarding
  const completed = steps.filter(done).length
  const step = steps.find((s) => s.id === selected)!

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Rocket}
        title={`Incorporación de ${onboardingCompany.name}`}
        badge="Nueva empresa"
        description={`${onboardingCompany.origin}. Completa los pasos para que GS active sus servicios; puedes guardar y continuar después.`}
      />

      <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/[0.06] sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-medium">
              {completed} de {steps.length} pasos completos
            </p>
            <p className="text-sm text-muted-foreground">Meta: servicios activos el {formatDate("2026-12-04", { day: "numeric", month: "long" })}</p>
          </div>
          <Progress value={(completed / steps.length) * 100} className="h-2" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <ol className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.06] lg:self-start">
          {steps.map((s) => (
            <li key={s.id} className="border-b last:border-0">
              <button
                type="button"
                onClick={() => setSelected(s.id)}
                aria-current={s.id === selected ? "step" : undefined}
                className={cn("flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50", s.id === selected && "bg-muted")}
              >
                <span className="mt-0.5">
                  {done(s) ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : s.status === "locked" ? (
                    <Lock className="size-5 text-muted-foreground/60" />
                  ) : s.status === "submitted" || s.status === "under_review" || s.status === "in_progress" ? (
                    <Loader2 className={cn("size-5 text-info", s.status !== "in_progress" && "animate-spin")} />
                  ) : (
                    <Circle className="size-5 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm leading-snug", s.status === "locked" ? "text-muted-foreground" : "font-medium")}>
                    {s.n}. {s.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {onboardingStatus[s.status].label} · {s.owner === "gs" ? "GS" : getPerson(s.responsibleId).firstName}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <section className="min-w-0 space-y-5 rounded-2xl bg-card p-6 ring-1 ring-foreground/[0.06] sm:p-7 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge {...onboardingStatus[step.status]} />
              <span className="text-[13px] text-muted-foreground">Paso {step.n} de 10</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>

          <InfoGrid
            columns={3}
            items={[
              { label: "Responsable", value: <PersonChip id={step.responsibleId} /> },
              { label: "Fecha objetivo", value: `${formatDate(step.dueDate, { day: "numeric", month: "long" })}${!done(step) && daysFromToday(step.dueDate) < 0 ? " · vencido" : ""}` },
              { label: "Lo valida", value: step.owner === "gs" ? "GS" : "GS · Contraloría y Legal" },
            ]}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="mb-2 text-[13px] text-muted-foreground">Requisitos</p>
              <ul className="space-y-1.5 text-sm">
                {step.requirements.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="mb-2 text-[13px] text-muted-foreground">Criterio de validación</p>
              <p className="text-sm">{step.criteria}</p>
            </div>
          </div>

          <div className="border-t pt-5">
            <StepAction key={step.id} step={step} />
          </div>
        </section>
      </div>
    </div>
  )
}

function StepAction({ step }: { step: OnboardingStep }) {
  const { persona, state: portalState } = usePortal()
  const [meetingsAtOpen, setMeetingsAtOpen] = useState(0)
  const { state, setStep, submitStep, saveOnboardingData } = useAdmin()
  const [scheduling, setScheduling] = useState(false)
  const [paying, setPaying] = useState(false)
  const data = state.onboardingData
  const [fiscal, setFiscal] = useState<Record<string, string>>({ razon: onboardingCompany.legalName, rfc: "En trámite", domicilio: "", correo: "", uso: "G03 · Gastos en general", ...data.fiscal })
  const [assigned, setAssigned] = useState<string[]>(data.users ?? ["U-ana", "U-laura"])
  const [files, setFiles] = useState<Record<string, string>>(data.files ?? {})

  if (done(step))
    return (
      <p className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="size-4" />
        {step.status === "approved" ? "Aprobado por GS" : "Completado"}
        {step.completedAt ? ` el ${formatDate(step.completedAt.slice(0, 10), { day: "numeric", month: "long" })}` : ""}.
      </p>
    )
  if (step.status === "submitted" || step.status === "under_review")
    return (
      <p className="flex items-center gap-2 text-sm text-info">
        <Loader2 className="size-4 animate-spin" />
        {step.status === "submitted" ? "Enviado. GS lo revisará en breve." : "GS está revisando la información."}
      </p>
    )

  switch (step.id) {
    case "OB-4": {
      const contract = state.contracts.find((c) => c.id === "PRO-2027")!
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm">
            {contract.signers.filter((s) => s.status === "firmado").length} de {contract.signers.length} firmas. Firman Roberto Elizondo y Jorge Salinas; GS contrafirma.
          </p>
          <Button asChild>
            <Link href="/contratos/PRO-2027">Ver propuesta y firmar</Link>
          </Button>
        </div>
      )
    }
    case "OB-5":
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { k: "razon", label: "Razón social" },
              { k: "rfc", label: "RFC" },
              { k: "domicilio", label: "Domicilio fiscal", placeholder: "Calle, número, colonia, municipio" },
              { k: "cp", label: "Código postal" },
              { k: "correo", label: "Correo para recibir facturas", placeholder: "facturas@ecopack.ejemplo.mx" },
            ].map((f) => (
              <div key={f.k} className="grid gap-1.5">
                <Label htmlFor={`f-${f.k}`}>{f.label}</Label>
                <Input id={`f-${f.k}`} value={fiscal[f.k] ?? ""} placeholder={f.placeholder} onChange={(e) => setFiscal({ ...fiscal, [f.k]: e.target.value })} />
              </div>
            ))}
            <div className="grid gap-1.5">
              <Label>Régimen fiscal</Label>
              <Select value={fiscal.regimen} onValueChange={(v) => setFiscal({ ...fiscal, regimen: v })}>
                <SelectTrigger className="w-full data-[size=default]:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="601 · General de Ley Personas Morales">601 · General de Ley Personas Morales</SelectItem>
                  <SelectItem value="603 · Personas Morales con Fines no Lucrativos">603 · Personas Morales con Fines no Lucrativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                saveOnboardingData({ fiscal })
                toast.success("Guardado", { description: "Puedes continuar después." })
              }}
            >
              <Save />
              Guardar y continuar después
            </Button>
            <Button
              disabled={!fiscal.domicilio?.trim() || !fiscal.correo?.trim()}
              onClick={() => {
                saveOnboardingData({ fiscal })
                submitStep(step.id)
                toast.success("Datos enviados a GS")
              }}
            >
              <Send />
              Enviar a GS
            </Button>
          </div>
        </div>
      )
    case "OB-6":
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Elige quién tendrá acceso a la información de {onboardingCompany.name}.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {state.users
              .filter((u) => u.status === "activo" || u.status === "invitado")
              .map((u) => (
                <label key={u.id} className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm">
                  <Checkbox checked={assigned.includes(u.id)} onCheckedChange={(v) => setAssigned((a) => (v ? [...a, u.id] : a.filter((x) => x !== u.id)))} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{roles[u.role].label}</span>
                  </span>
                </label>
              ))}
          </div>
          <div className="flex justify-end">
            <Button
              disabled={assigned.length === 0}
              onClick={() => {
                saveOnboardingData({ users: assigned })
                setStep(step.id, "completed")
                toast.success("Usuarios asignados")
              }}
            >
              Confirmar usuarios
            </Button>
          </div>
        </div>
      )
    case "OB-7": {
      const all = step.requirements.every((r) => files[r])
      return (
        <div className="space-y-4">
          <ul className="divide-y rounded-xl border">
            {step.requirements.map((r) => (
              <li key={r} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                {files[r] ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}
                <span className="min-w-0 flex-1">
                  <span className="block">{r}</span>
                  {files[r] && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Paperclip className="size-3" />
                      {files[r]}
                    </span>
                  )}
                </span>
                <Button size="sm" variant="outline" onClick={() => setFiles({ ...files, [r]: `${r.replace(/[^\wáéíóúñ]+/gi, "_").slice(0, 32)}.pdf` })}>
                  <FileUp />
                  {files[r] ? "Reemplazar" : "Subir"}
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                saveOnboardingData({ files })
                toast.success("Guardado")
              }}
            >
              <Save />
              Guardar
            </Button>
            <Button
              disabled={!all}
              onClick={() => {
                saveOnboardingData({ files })
                submitStep(step.id)
                toast.success("Documentos enviados a GS")
              }}
            >
              <Send />
              Enviar a GS
            </Button>
          </div>
        </div>
      )
    }
    case "OB-8": {
      if (step.status === "locked")
        return (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" /> Se habilita al firmar la propuesta 2027: en ese momento se emite la factura del anticipo.
          </p>
        )
      const inv = state.invoices.find((i) => i.id === "A-4830")
      if (!inv) return null
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm">
            Factura {inv.folio} · {formatCurrency(inv.total)} con IVA · saldo {formatCurrency(balanceOf(inv))}
          </p>
          <Button variant="outline" asChild>
            <Link href={`/facturacion/${inv.id}`}>Ver factura</Link>
          </Button>
          {roles[persona.role].can.pay && balanceOf(inv) > 0 && <Button onClick={() => setPaying(true)}>Pagar anticipo</Button>}
          {paying && <PayDialog invoice={inv} open onOpenChange={setPaying} />}
        </div>
      )
    }
    case "OB-9": {
      const meeting = portalState.meetings.filter((m) => m.status !== "cancelada").at(-1)
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm">{meeting ? `Reunión ${meeting.status} para el ${formatDate(meeting.date, { day: "numeric", month: "long" })} a las ${meeting.time} h.` : "Agenda una reunión de arranque con Mariana Ortega y el equipo de GS."}</p>
          <Button
            onClick={() => {
              setMeetingsAtOpen(portalState.meetings.length)
              setScheduling(true)
            }}
          >
            <CalendarClock />
            Agendar reunión
          </Button>
          {scheduling && (
            <ScheduleMeetingDialog
              open
              hostId="mariana"
              onOpenChange={(v) => {
                setScheduling(v)
                if (!v && portalState.meetings.length > meetingsAtOpen) setStep(step.id, "completed")
              }}
            />
          )}
        </div>
      )
    }
    case "OB-10":
      return (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {step.status === "locked" ? <Lock className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
          {step.status === "locked" ? "GS activará los servicios cuando los pasos 1 a 9 estén completos." : "GS está activando los servicios…"}
        </p>
      )
    default:
      return null
  }
}
