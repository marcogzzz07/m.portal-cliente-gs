"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, CalendarClock, LifeBuoy, Mail, MessageSquare, Phone, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { UserAvatar } from "@/components/shared/user-avatar"
import { getPerson, gsTeam, serviceNames } from "@/data/organization"
import { useScopedData } from "@/hooks/use-scoped-data"
import { formatDate } from "@/lib/format"
import { companyShort } from "@/lib/labels"
import type { GsMember, ServiceKey } from "@/lib/types"
import { usePortal } from "@/store/portal-store"
import { ScheduleMeetingDialog } from "./schedule-meeting-dialog"

const serviceOrder: ServiceKey[] = ["contabilidad", "impuestos", "auditoria", "legal", "facturacion"]

/** Equipo GS (Product Spec §19): contacto principal, especialistas, sustituciones y escalamiento. */
export function TeamView() {
  const router = useRouter()
  const { can, createConversation } = usePortal()
  const { scope, scopeLabel, scopeCompanies } = useScopedData()
  const visible = gsTeam.filter((m) => m.companies === "all" || m.companies.some((c) => scopeCompanies.includes(c)))
  const primary = visible.find((m) => m.primary)!
  const [scheduleWith, setScheduleWith] = useState<string | null>(null)

  function talk(member: GsMember) {
    const p = getPerson(member.personId)
    const service = member.services[0]
    const id = createConversation(
      {
        subject: `Consulta para ${p.firstName} ${p.lastName}`,
        context: { type: "general", label: member.area },
        companies: scope === "grupo" ? scopeCompanies : [scope],
        service,
        gsOwnerId: member.personId,
      },
      `Hola, ${p.firstName}. Quisiera comentarte un tema sobre ${serviceNames[service].toLowerCase()}.`
    )
    router.push(`/mensajes/${id}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Equipo GS" description={`Las personas de González Solís que atienden a ${scopeLabel}, por servicio.`} />

      <section className="flex flex-col gap-5 rounded-2xl bg-sidebar p-5 text-sidebar-foreground sm:flex-row sm:items-center sm:p-6">
        <UserAvatar firstName={getPerson(primary.personId).firstName} lastName={getPerson(primary.personId).lastName} size="xl" highlight />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold tracking-wider text-sidebar-primary uppercase">Tu contacto principal</p>
          <h2 className="text-xl font-bold text-white">
            {getPerson(primary.personId).firstName} {getPerson(primary.personId).lastName}
          </h2>
          <p className="text-sm">{getPerson(primary.personId).title} · {primary.materia}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-sidebar-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" /> {getPerson(primary.personId).email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-3.5" /> {getPerson(primary.personId).phone}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can.respond && (
            <Button onClick={() => talk(primary)} className="bg-white text-foreground hover:bg-white/90">
              <MessageSquare />
              Escribir
            </Button>
          )}
          <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => setScheduleWith(primary.personId)}>
            <CalendarClock />
            Agendar reunión
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {serviceOrder.map((s) => {
            const members = visible.filter((m) => !m.primary && m.services.includes(s))
            if (members.length === 0) return null
            return (
              <section key={s} className="space-y-2">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{serviceNames[s]}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {members.map((m) => {
                    const p = getPerson(m.personId)
                    const sub = m.away ? getPerson(m.away.substituteId) : null
                    return (
                      <article key={m.personId} className="flex flex-col gap-4 rounded-2xl bg-card ring-1 ring-foreground/[0.06] p-6">
                        <div className="flex items-start gap-3">
                          <UserAvatar firstName={p.firstName} lastName={p.lastName} size="lg" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{p.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{m.materia}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {m.companies === "all" ? "Todas las empresas del grupo" : m.companies.map(companyShort).join(", ")}
                            </p>
                          </div>
                        </div>
                        {m.away && sub && (
                          <p className="rounded-lg bg-warning/12 px-3 py-2 text-xs">
                            <span className="font-semibold">Ausente del {formatDate(m.away.from)} al {formatDate(m.away.to)}.</span> Te atiende {sub.firstName} {sub.lastName}.
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
                          <span className="truncate text-[13px] text-muted-foreground">{p.email}</span>
                          {can.respond && (
                            <span className="flex shrink-0 gap-1.5">
                              <Button size="sm" variant="ghost" onClick={() => setScheduleWith(m.personId)}>
                                <CalendarClock />
                                Agendar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => talk(m)}>
                                <MessageSquare />
                                Escribir
                              </Button>
                            </span>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <div className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <SectionCard title="Ruta de escalamiento" description="Si algo no avanza como esperas" icon={ArrowDown}>
            <ol className="space-y-3">
              {[
                { t: "Especialista del servicio", d: "Responde en 1 día hábil." },
                { t: "Gerente del servicio", d: "Si no hay respuesta en 2 días hábiles." },
                { t: "Socia de relación · Mariana Ortega", d: "Temas que involucran varios servicios." },
                { t: "Dirección de GS", d: "Inconformidades con el servicio." },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                  <span>
                    <span className="block text-sm font-medium">{s.t}</span>
                    <span className="text-xs text-muted-foreground">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </SectionCard>
          <SectionCard title="Soporte del portal" description="Accesos, contraseñas y dudas de uso" icon={LifeBuoy}>
            <p className="text-sm">Mesa de ayuda · lunes a viernes de 8:00 a 19:00 h</p>
            <p className="mt-1 text-sm text-muted-foreground">soporte.portal@gs.ejemplo.mx · 81 5550 1000</p>
          </SectionCard>
        </div>
      </div>
      {scheduleWith && <ScheduleMeetingDialog key={scheduleWith} open hostId={scheduleWith} onOpenChange={(v) => !v && setScheduleWith(null)} />}
    </div>
  )
}
