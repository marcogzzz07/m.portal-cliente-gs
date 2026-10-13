"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, CircleDashed, FlaskConical, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { UserAvatar } from "@/components/shared/user-avatar"
import { getPerson, personas } from "@/data/organization"
import { roles } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"

/** Recorridos obligatorios del Product Spec §25 y la fase en que quedan navegables. */
const journeys: { n: number; title: string; phase: 1 | 2 | 3; href?: string; hint?: string }[] = [
  { n: 1, title: "Activar invitación y MFA", phase: 3 },
  { n: 2, title: "Completar onboarding", phase: 3 },
  { n: 3, title: "Firmar propuesta mediante DocuSign simulado", phase: 3 },
  { n: 4, title: "Cambiar entre grupo y empresas", phase: 1, href: "/", hint: "Usa el selector de contexto del encabezado." },
  { n: 5, title: "Consultar inicio ejecutivo", phase: 1, href: "/" },
  { n: 6, title: "Cargar y reemplazar un documento", phase: 1, href: "/documentos/DOC-202", hint: "Sube la versión 2 de las facturas de Manufactura." },
  { n: 7, title: "Consultar calendario y completar una acción", phase: 1, href: "/calendario", hint: "Abre un vencimiento y atiéndelo desde ahí." },
  { n: 8, title: "Revisar información financiera e insight", phase: 2, hint: "En Fase 1: tarjetas de insight en Inicio." },
  { n: 9, title: "Consultar Auditoría anual", phase: 2 },
  { n: 10, title: "Abrir conversación contextual", phase: 1, href: "/mensajes/CONV-01" },
  { n: 11, title: "Aclarar factura y simular pago", phase: 3 },
  { n: 12, title: "Invitar usuario con acceso a una empresa", phase: 3 },
  { n: 13, title: "Leer novedad fiscal personalizada", phase: 2 },
  { n: 14, title: "Recorrer las vistas críticas en móvil", phase: 1, hint: "Reduce la ventana a 360 px o abre en el teléfono." },
]

/** Controles del prototipo: usuario simulado, simulaciones y recorridos. No forma parte del producto. */
export function DemoPanel() {
  const [open, setOpen] = useState(false)
  const { persona, setPersona, state, setDemo, reset } = usePortal()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        <FlaskConical className="size-3.5" />
        Controles de la demo
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <FlaskConical className="size-4 text-brand" />
              Controles del prototipo
            </SheetTitle>
            <SheetDescription>Datos ficticios. Los cambios se guardan solo en este navegador.</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 p-4">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Ver el portal como</h3>
              <div className="space-y-1.5" role="radiogroup" aria-label="Usuario simulado">
                {personas.map((p) => {
                  const person = getPerson(p.personId)
                  const selected = p.personId === persona.personId
                  return (
                    <button
                      key={p.personId}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPersona(p.personId)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        selected && "border-brand bg-brand-soft/50"
                      )}
                    >
                      <UserAvatar firstName={person.firstName} lastName={person.lastName} size="sm" highlight={selected} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-semibold">
                          {person.firstName} {person.lastName} <span className="font-normal text-muted-foreground">· {person.title}</span>
                        </span>
                        <span className="text-xs font-medium text-brand">{roles[p.role].label}</span>
                        <span className="text-xs text-muted-foreground">{p.scenario}</span>
                      </span>
                      {selected && <Check className="mt-1 size-4 text-brand" />}
                    </button>
                  )
                })}
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Simulaciones</h3>
              <div className="flex items-start justify-between gap-4">
                <Label htmlFor="auto" className="flex flex-col items-start gap-0.5">
                  <span>Respuestas automáticas de GS</span>
                  <span className="text-xs font-normal text-muted-foreground">GS contesta mensajes e inicia revisiones en segundos.</span>
                </Label>
                <Switch id="auto" checked={state.demo.autoReplies} onCheckedChange={(v) => setDemo("autoReplies", v)} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <Label htmlFor="down" className="flex flex-col items-start gap-0.5">
                  <span>ContaLink no responde</span>
                  <span className="text-xs font-normal text-muted-foreground">Muestra la última sincronización válida y advertencias.</span>
                </Label>
                <Switch id="down" checked={state.demo.contalinkDown} onCheckedChange={(v) => setDemo("contalinkDown", v)} />
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="w-full">
                <RotateCcw />
                Restablecer datos de la demo
              </Button>
            </section>

            <Separator />

            <section className="space-y-2">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Recorridos obligatorios (Product Spec §25)</h3>
              <ol className="space-y-1">
                {journeys.map((j) => {
                  const ready = j.phase === 1
                  const body = (
                    <>
                      <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", ready ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                        {ready ? <Check className="size-3" /> : <CircleDashed className="size-3" />}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={cn("text-sm", !ready && "text-muted-foreground")}>
                          {j.n}. {j.title}
                        </span>
                        {j.hint && <span className="text-xs text-muted-foreground">{j.hint}</span>}
                      </span>
                      <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold", ready ? "bg-success/12 text-success" : "border border-dashed text-muted-foreground")}>Fase {j.phase}</span>
                    </>
                  )
                  return (
                    <li key={j.n}>
                      {j.href ? (
                        <Link href={j.href} onClick={() => setOpen(false)} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted">
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-2.5 px-2 py-1.5">{body}</div>
                      )}
                    </li>
                  )
                })}
              </ol>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
