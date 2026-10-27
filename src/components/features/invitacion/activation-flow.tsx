"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, CheckCircle2, Download, KeyRound, Mail, MessageSquareText, ShieldCheck, Smartphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BrandMark } from "@/components/layout/brand-logo"
import { getPerson } from "@/data/organization"
import { formatDate } from "@/lib/format"
import { roles } from "@/lib/permissions"
import { companyShort } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { useAdmin } from "@/store/admin-store"
import { usePortal } from "@/store/portal-store"

type Step = "invitacion" | "correo" | "contrasena" | "mfa" | "respaldo" | "avisos" | "listo"
const order: Step[] = ["invitacion", "correo", "contrasena", "mfa", "respaldo", "avisos", "listo"]
const labels: Record<Step, string> = { invitacion: "Invitación", correo: "Correo", contrasena: "Contraseña", mfa: "MFA", respaldo: "Respaldo", avisos: "Avisos", listo: "Listo" }

const EMAIL_CODE = "482913"
const MFA_CODE = "731204"
const backupCodes = ["8F2K-QW7D", "M3ZP-4H9X", "T6RA-2LCV", "Y9BN-7EJQ", "C4UF-8SKD", "H2WX-5PGM", "N7VE-3TRL", "D5QJ-9MZA"]

/** Patrón tipo QR decorativo (determinista) para la configuración de la app autenticadora. */
function FakeQr() {
  const cells = useMemo(() => {
    const out: boolean[] = []
    let h = 2166136261
    for (let i = 0; i < 21 * 21; i++) {
      h = Math.imul(h ^ (i * 7919), 16777619)
      out.push(((h >>> 0) % 100) < 46)
    }
    return out
  }, [])
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7
    const ring = (ox: number, oy: number) => inBox(ox, oy) && (x === ox || x === ox + 6 || y === oy || y === oy + 6 || (x >= ox + 2 && x <= ox + 4 && y >= oy + 2 && y <= oy + 4))
    if (inBox(0, 0) || inBox(14, 0) || inBox(0, 14)) return { finder: true, on: ring(0, 0) || ring(14, 0) || ring(0, 14) }
    return { finder: false, on: false }
  }
  return (
    <svg viewBox="0 0 21 21" className="size-40 rounded-lg bg-white p-2 ring-1 ring-border" role="img" aria-label="Código QR de configuración (simulado)">
      {cells.map((on, i) => {
        const x = i % 21
        const y = Math.floor(i / 21)
        const f = finder(x, y)
        return (f.finder ? f.on : on) ? <rect key={i} x={x} y={y} width="1" height="1" fill="#111" /> : null
      })}
    </svg>
  )
}

/** Activación de invitación (Product Spec §6): correo, contraseña, MFA, códigos de respaldo y avisos. Meta: ~3 minutos. */
export function ActivationFlow() {
  const { hydrated } = usePortal()
  // Espera a recuperar la sesión de demo para saber si la invitación ya se usó.
  return hydrated ? <Activation /> : <div className="min-h-dvh bg-background" />
}

function Activation() {
  const router = useRouter()
  const { setPersona } = usePortal()
  const { state, activateInvitation } = useAdmin()
  const invite = state.users.find((u) => u.id === "U-carmen")!
  const inviter = getPerson(invite.invitedBy ?? "ana")
  const [step, setStep] = useState<Step>(invite.status === "activo" ? "listo" : "invitacion")
  const [emailCode, setEmailCode] = useState("")
  const [pwd, setPwd] = useState("")
  const [pwd2, setPwd2] = useState("")
  const [mfa, setMfa] = useState<"app" | "sms">("app")
  const [phone, setPhone] = useState("")
  const [mfaCode, setMfaCode] = useState("")
  const [saved, setSaved] = useState(false)
  const [accept, setAccept] = useState({ privacidad: false, terminos: false, comunicaciones: false })

  const rules = [
    { ok: pwd.length >= 12, label: "Al menos 12 caracteres" },
    { ok: /[A-Z]/.test(pwd) && /[a-z]/.test(pwd), label: "Mayúsculas y minúsculas" },
    { ok: /\d/.test(pwd), label: "Al menos un número" },
    { ok: /[^A-Za-z0-9]/.test(pwd), label: "Al menos un símbolo" },
  ]
  const pwdOk = rules.every((r) => r.ok) && pwd === pwd2
  const idx = order.indexOf(step)
  const next = () => setStep(order[idx + 1])

  function downloadCodes() {
    const text = `Códigos de respaldo · Portal de Clientes GS (prototipo)\n${invite.email}\n\n${backupCodes.join("\n")}\n\nCada código sirve una sola vez.`
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "codigos-respaldo-portal-gs.txt"
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="bg-[var(--gs-color-warning-subtle)] px-4 py-1 text-center text-xs text-[var(--gs-color-warning-foreground)]">Datos ficticios · Simulación de activación de cuenta</div>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-10">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-[15px] font-semibold">Portal de Clientes</p>
            <p className="text-xs text-muted-foreground">González Solís</p>
          </div>
        </div>

        {step !== "invitacion" && (
          <ol className="flex items-center gap-1.5" aria-label="Progreso">
            {order.slice(1).map((s, i) => (
              <li key={s} className="flex flex-1 flex-col gap-1">
                <span className={cn("h-1 rounded-full", i + 1 <= idx ? "bg-primary" : "bg-muted")} />
                <span className={cn("hidden text-[11px] sm:block", i + 1 === idx ? "font-medium" : "text-muted-foreground")}>{labels[s]}</span>
              </li>
            ))}
          </ol>
        )}

        <section className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
          {step === "invitacion" && (
            <>
              <div className="space-y-2">
                <span className="flex size-11 items-center justify-center rounded-full bg-muted">
                  <Mail className="size-5" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight">Hola, {invite.firstName}</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {inviter.firstName} {inviter.lastName} te invitó al Portal de Clientes de González Solís para el Grupo EcoPack Norte. Aquí verás pendientes, documentos y conversaciones con GS.
                </p>
              </div>
              <dl className="grid gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Rol</dt>
                  <dd className="font-medium">{roles[invite.role].label}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Vence</dt>
                  <dd className="font-medium">{invite.expiresAt ? formatDate(invite.expiresAt, { day: "numeric", month: "long" }) : "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Empresas</dt>
                  <dd className="font-medium">{invite.companies.map((c) => `EcoPack ${companyShort(c)}`).join(" y ")}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Correo</dt>
                  <dd className="font-medium break-all">{invite.email}</dd>
                </div>
              </dl>
              <Button size="lg" className="w-full" onClick={next}>
                Aceptar invitación
              </Button>
              <p className="text-center text-xs text-muted-foreground">Toma alrededor de 3 minutos. Si no esperabas esta invitación, ignórala.</p>
            </>
          )}

          {step === "correo" && (
            <>
              <Header icon={Mail} title="Confirma tu correo" text={`Enviamos un código de 6 dígitos a ${invite.email}.`} />
              <div className="grid gap-1.5">
                <Label htmlFor="email-code">Código</Label>
                <Input id="email-code" inputMode="numeric" maxLength={6} value={emailCode} onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className="h-12 text-center text-xl tracking-[0.5em]" />
                <DemoHint code={EMAIL_CODE} onUse={() => setEmailCode(EMAIL_CODE)} />
              </div>
              <Button size="lg" className="w-full" disabled={emailCode !== EMAIL_CODE} onClick={next}>
                Confirmar
              </Button>
            </>
          )}

          {step === "contrasena" && (
            <>
              <Header icon={KeyRound} title="Crea tu contraseña" text="La usarás junto con tu segundo factor cada vez que entres." />
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="pwd">Contraseña</Label>
                  <Input id="pwd" type="password" autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pwd2">Confirmar contraseña</Label>
                  <Input id="pwd2" type="password" autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
                  {pwd2 && pwd !== pwd2 && <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>}
                </div>
                <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
                  {rules.map((r) => (
                    <li key={r.label} className={cn("flex items-center gap-2", r.ok ? "text-success" : "text-muted-foreground")}>
                      <Check className={cn("size-3.5", !r.ok && "opacity-30")} />
                      {r.label}
                    </li>
                  ))}
                </ul>
              </div>
              <Button size="lg" className="w-full" disabled={!pwdOk} onClick={next}>
                Continuar
              </Button>
            </>
          )}

          {step === "mfa" && (
            <>
              <Header icon={ShieldCheck} title="Configura tu segundo factor (MFA)" text="Además de tu contraseña, te pediremos un código de 6 dígitos al entrar. Así nadie puede usar tu cuenta aunque conozca tu contraseña." />
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { v: "app", label: "App autenticadora", sub: "Recomendado", icon: Smartphone },
                    { v: "sms", label: "Mensaje SMS", sub: "A tu celular", icon: MessageSquareText },
                  ] as const
                ).map((o) => (
                  <button key={o.v} type="button" onClick={() => setMfa(o.v)} aria-pressed={mfa === o.v} className={cn("flex items-start gap-3 rounded-xl border p-3 text-left text-sm", mfa === o.v ? "border-brand bg-brand-soft" : "hover:bg-muted")}>
                    <o.icon className="mt-0.5 size-4" />
                    <span>
                      <span className="block font-medium">{o.label}</span>
                      <span className="text-xs text-muted-foreground">{o.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
              {mfa === "app" ? (
                <div className="flex flex-col items-center gap-4 rounded-xl bg-muted p-5 sm:flex-row sm:items-start">
                  <FakeQr />
                  <div className="space-y-2 text-sm">
                    <p>1. Abre Google Authenticator, Microsoft Authenticator o similar.</p>
                    <p>2. Escanea el código o escribe la clave:</p>
                    <p className="font-mono text-xs tracking-wider">JBSW Y3DP EHPK 3PXP</p>
                    <p>3. Escribe el código de 6 dígitos que aparece en la app.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-1.5">
                  <Label htmlFor="phone">Celular</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="81 0000 0000" />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="mfa-code">Código de verificación</Label>
                <Input id="mfa-code" inputMode="numeric" maxLength={6} value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className="h-12 text-center text-xl tracking-[0.5em]" />
                <DemoHint code={MFA_CODE} onUse={() => setMfaCode(MFA_CODE)} />
              </div>
              <Button size="lg" className="w-full" disabled={mfaCode !== MFA_CODE || (mfa === "sms" && phone.replace(/\D/g, "").length < 10)} onClick={next}>
                Verificar
              </Button>
            </>
          )}

          {step === "respaldo" && (
            <>
              <Header icon={KeyRound} title="Guarda tus códigos de respaldo" text="Si pierdes tu celular, podrás entrar con uno de estos códigos. Cada uno sirve una sola vez." />
              <ul className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-4 font-mono text-sm">
                {backupCodes.map((c) => (
                  <li key={c} className="rounded-md bg-card px-3 py-1.5 text-center">
                    {c}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={downloadCodes}>
                <Download />
                Descargar códigos
              </Button>
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox checked={saved} onCheckedChange={(v) => setSaved(Boolean(v))} />
                Guardé mis códigos en un lugar seguro.
              </label>
              <Button size="lg" className="w-full" disabled={!saved} onClick={next}>
                Continuar
              </Button>
            </>
          )}

          {step === "avisos" && (
            <>
              <Header icon={ShieldCheck} title="Avisos y términos" text="Para usar el portal necesitamos tu aceptación." />
              <div className="space-y-2">
                {(
                  [
                    { k: "privacidad", label: "Acepto el Aviso de privacidad", detail: "Cómo GS trata tus datos personales y los de tu empresa." },
                    { k: "terminos", label: "Acepto los Términos de uso del portal", detail: "Reglas de acceso, confidencialidad y uso de la información." },
                    { k: "comunicaciones", label: "Acepto recibir comunicaciones electrónicas", detail: "Avisos, recordatorios y documentos por el portal y por correo." },
                  ] as const
                ).map((a) => (
                  <label key={a.k} className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                    <Checkbox checked={accept[a.k]} onCheckedChange={(v) => setAccept((prev) => ({ ...prev, [a.k]: Boolean(v) }))} className="mt-0.5" />
                    <span>
                      <span className="block font-medium">{a.label}</span>
                      <span className="text-xs text-muted-foreground">{a.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
              <Button
                size="lg"
                className="w-full"
                disabled={!accept.privacidad || !accept.terminos || !accept.comunicaciones}
                onClick={() => {
                  activateInvitation(invite.id, mfa)
                  next()
                }}
              >
                Activar mi cuenta
              </Button>
            </>
          )}

          {step === "listo" && (
            <div className="space-y-5 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--gs-color-success-subtle)] text-success">
                <CheckCircle2 className="size-7" />
              </span>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Tu acceso está activo</h1>
                <p className="text-sm text-muted-foreground">
                  {invite.firstName}, ya puedes entrar al portal. {inviter.firstName} recibió un aviso de que activaste tu cuenta.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  setPersona("carmen")
                  router.push("/")
                }}
              >
                Entrar al portal
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPersona("ana")
                  router.push("/usuarios")
                }}
              >
                Volver a Usuarios (como administradora)
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Header({ icon: Icon, title, text }: { icon: typeof Mail; title: string; text: string }) {
  return (
    <div className="space-y-2">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5" />
      </span>
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}

function DemoHint({ code, onUse }: { code: string; onUse: () => void }) {
  return (
    <button type="button" onClick={onUse} className="text-left text-xs text-muted-foreground hover:text-foreground">
      Demo: el código es <span className="font-mono font-medium text-foreground">{code}</span> (clic para usarlo)
    </button>
  )
}
