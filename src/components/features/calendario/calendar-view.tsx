"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Clock, Copy, MapPin, Rss } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs } from "@/components/ui/tabs"
import { AccessDenied } from "@/components/shared/access-denied"
import { CompanyTag } from "@/components/shared/company-tag"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { PageTabsList, PageTabsTrigger } from "@/components/shared/page-tabs"
import { serviceNames } from "@/data/organization"
import { useScopedData } from "@/hooks/use-scoped-data"
import { DEMO_TODAY, formatDate, formatLongDate, parseDate } from "@/lib/format"
import { canAccessModule } from "@/lib/permissions"
import { eventTypeMeta } from "@/lib/status"
import type { CalendarEvent, EventType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"
import { ActionDetailSheet } from "../pendientes/action-detail-sheet"

type View = "mes" | "semana" | "dia" | "agenda"
const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function addDays(isoDate: string, n: number) {
  const d = parseDate(isoDate)
  d.setDate(d.getDate() + n)
  return iso(d)
}
function startOfWeek(isoDate: string) {
  const d = parseDate(isoDate)
  const dow = (d.getDay() + 6) % 7
  return addDays(isoDate, -dow)
}
/** Un evento de varios días ocupa cada día de su rango. */
function occursOn(e: CalendarEvent, day: string) {
  return e.endDate ? day >= e.date && day <= e.endDate : e.date === day
}

/** Calendario (Product Spec §10): día, semana, mes y agenda; suscripción externa de solo lectura. */
export function CalendarView() {
  const { persona } = usePortal()
  const { events, scopeLabel } = useScopedData()
  const [view, setView] = useState<View>("mes")
  const [cursor, setCursor] = useState(DEMO_TODAY)
  const [selectedDay, setSelectedDay] = useState(DEMO_TODAY)
  const [types, setTypes] = useState<Set<EventType>>(new Set(Object.keys(eventTypeMeta) as EventType[]))
  const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [subscribeOpen, setSubscribeOpen] = useState(false)

  const visible = useMemo(() => events.filter((e) => types.has(e.type)), [events, types])
  const on = (day: string) => visible.filter((e) => occursOn(e, day))

  if (!canAccessModule(persona, "calendario")) return <AccessDenied />

  const cursorDate = parseDate(cursor)
  const monthStart = iso(new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1))
  const gridStart = startOfWeek(monthStart)
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const weekStart = startOfWeek(cursor)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function move(dir: -1 | 1) {
    if (view === "mes") {
      const d = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + dir, 1)
      setCursor(iso(d))
    } else if (view === "semana") setCursor(addDays(cursor, 7 * dir))
    else if (view === "dia") {
      const next = addDays(cursor, dir)
      setCursor(next)
      setSelectedDay(next)
    }
  }

  const label =
    view === "mes"
      ? formatDate(cursor, { month: "long", year: "numeric" })
      : view === "semana"
        ? `${formatDate(weekDays[0])} – ${formatDate(weekDays[6], { day: "numeric", month: "short", year: "numeric" })}`
        : view === "dia"
          ? formatLongDate(cursor)
          : "Desde hoy"

  function toggleType(t: EventType) {
    setTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const agenda = visible.filter((e) => (e.endDate ?? e.date) >= DEMO_TODAY)
  const agendaDays = [...new Set(agenda.map((e) => (e.date < DEMO_TODAY ? DEMO_TODAY : e.date)))].sort()

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarDays}
        title="Calendario"
        description={`Obligaciones, reuniones, entregas, pagos y renovaciones de ${scopeLabel}. Los vencimientos se atienden desde aquí.`}
        actions={
          <Button variant="outline" onClick={() => setSubscribeOpen(true)}>
            <Rss />
            Suscribirme
          </Button>
        }
      />

      <Tabs value={view} onValueChange={(v) => setView(v as View)} className="gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => move(-1)} disabled={view === "agenda"} aria-label="Anterior">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" onClick={() => move(1)} disabled={view === "agenda"} aria-label="Siguiente">
              <ChevronRight />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCursor(DEMO_TODAY)
                setSelectedDay(DEMO_TODAY)
              }}
            >
              Hoy
            </Button>
            <h2 className="ml-1 text-lg font-semibold first-letter:uppercase">{label}</h2>
          </div>
          <PageTabsList className="w-auto border-b-0">
            <PageTabsTrigger value="mes" className="px-3">Mes</PageTabsTrigger>
            <PageTabsTrigger value="semana" className="px-3">Semana</PageTabsTrigger>
            <PageTabsTrigger value="dia" className="px-3">Día</PageTabsTrigger>
            <PageTabsTrigger value="agenda" className="px-3">Agenda</PageTabsTrigger>
          </PageTabsList>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por tipo">
          {(Object.keys(eventTypeMeta) as EventType[]).map((t) => {
            const active = types.has(t)
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => toggleType(t)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active ? "bg-card" : "bg-transparent text-muted-foreground line-through opacity-60"
                )}
              >
                <span className={cn("size-2 rounded-full", eventTypeMeta[t].dot)} aria-hidden />
                {eventTypeMeta[t].label}
              </button>
            )
          })}
        </div>

        {view === "mes" && (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="grid grid-cols-7 border-b bg-muted/40">
                {weekdays.map((d) => (
                  <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((day) => {
                  const dayEvents = on(day)
                  const inMonth = day.slice(0, 7) === cursor.slice(0, 7)
                  const isToday = day === DEMO_TODAY
                  const isSelected = day === selectedDay
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      aria-label={`${formatLongDate(day)}, ${dayEvents.length} eventos`}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex min-h-14 flex-col items-stretch gap-1 border-r border-b p-1 text-left transition-colors last:border-r-0 hover:bg-muted/50 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:min-h-16 sm:p-1.5 xl:min-h-24 [&:nth-child(7n)]:border-r-0",
                        !inMonth && "bg-muted/30 text-muted-foreground",
                        isSelected && "bg-brand-soft/40"
                      )}
                    >
                      <span className={cn("flex size-6 items-center justify-center self-center rounded-full text-xs font-medium xl:self-start", isToday && "bg-brand font-bold text-white")}>
                        {Number(day.slice(8))}
                      </span>
                      {/* Móvil: puntos. Escritorio: títulos. */}
                      <span className="flex flex-wrap justify-center gap-0.5 xl:hidden">
                        {dayEvents.slice(0, 4).map((e) => (
                          <span key={e.id} className={cn("size-1.5 rounded-full", eventTypeMeta[e.type].dot)} />
                        ))}
                      </span>
                      <span className="hidden flex-col gap-0.5 xl:flex">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span key={e.id} className={cn("truncate rounded px-1 py-0.5 text-[11px] leading-tight font-medium", eventTypeMeta[e.type].chip)}>
                            {e.time && !e.endDate ? `${e.time} ` : ""}
                            {e.title}
                          </span>
                        ))}
                        {dayEvents.length > 3 && <span className="px-1 text-[11px] text-muted-foreground">+{dayEvents.length - 3} más</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <DayPanel day={selectedDay} events={on(selectedDay)} onOpen={setOpenEvent} />
          </div>
        )}

        {view === "semana" && (
          <div className="grid gap-2 md:grid-cols-7">
            {weekDays.map((day) => (
              <div key={day} className={cn("min-h-40 rounded-xl border bg-card p-2", day === DEMO_TODAY && "ring-2 ring-brand")}>
                <p className="mb-2 flex items-baseline gap-1.5 px-1">
                  <span className="text-xs text-muted-foreground uppercase">{formatDate(day, { weekday: "short" })}</span>
                  <span className="text-lg font-bold">{Number(day.slice(8))}</span>
                </p>
                <div className="space-y-1.5">
                  {on(day).map((e) => (
                    <EventChip key={e.id} event={e} onOpen={setOpenEvent} />
                  ))}
                  {on(day).length === 0 && <p className="px-1 text-xs text-muted-foreground">Sin eventos</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "dia" && <DayPanel day={cursor} events={on(cursor)} onOpen={setOpenEvent} large />}

        {view === "agenda" &&
          (agenda.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Sin eventos próximos" description="Ajusta los filtros de tipo para ver más eventos." />
          ) : (
            <div className="space-y-4">
              {agendaDays.map((day) => (
                <section key={day} className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)]">
                  <h3 className={cn("text-sm font-semibold first-letter:uppercase sm:pt-2", day === DEMO_TODAY && "text-brand")}>
                    {day === DEMO_TODAY ? "Hoy" : formatDate(day, { weekday: "long", day: "numeric", month: "short" })}
                  </h3>
                  <div className="space-y-1.5">
                    {agenda
                      .filter((e) => (e.date < DEMO_TODAY ? DEMO_TODAY : e.date) === day)
                      .map((e) => (
                        <EventChip key={e.id} event={e} onOpen={setOpenEvent} detailed />
                      ))}
                  </div>
                </section>
              ))}
            </div>
          ))}
      </Tabs>

      <EventDialog
        event={openEvent}
        onClose={() => setOpenEvent(null)}
        onOpenAction={(id) => {
          setOpenEvent(null)
          setActionId(id)
        }}
      />
      <ActionDetailSheet itemId={actionId} onClose={() => setActionId(null)} />
      <SubscribeDialog open={subscribeOpen} onOpenChange={setSubscribeOpen} />
    </div>
  )
}

function DayPanel({ day, events, onOpen, large }: { day: string; events: CalendarEvent[]; onOpen: (e: CalendarEvent) => void; large?: boolean }) {
  return (
    <div className={cn("space-y-2 rounded-xl border bg-card p-4", large && "max-w-3xl")}>
      <p className="text-sm font-semibold first-letter:uppercase">{day === DEMO_TODAY ? `Hoy · ${formatLongDate(day)}` : formatLongDate(day)}</p>
      {events.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sin eventos este día.</p>
      ) : (
        <div className="space-y-1.5">
          {events.map((e) => (
            <EventChip key={e.id} event={e} onOpen={onOpen} detailed />
          ))}
        </div>
      )}
    </div>
  )
}

function EventChip({ event, onOpen, detailed }: { event: CalendarEvent; onOpen: (e: CalendarEvent) => void; detailed?: boolean }) {
  const meta = eventTypeMeta[event.type]
  return (
    <button type="button" onClick={() => onOpen(event)} className="flex w-full items-start gap-2 rounded-lg border bg-background px-2.5 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", meta.dot)} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug font-medium">{event.title}</span>
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>{meta.label}</span>
          {event.time && (
            <span>
              {event.time}
              {event.endTime && `–${event.endTime}`} h
            </span>
          )}
          {event.endDate && <span>hasta el {formatDate(event.endDate)}</span>}
          {detailed && <CompanyTag companies={event.companies} />}
        </span>
      </span>
      {event.actionItemId && <span className="shrink-0 rounded-full bg-brand-soft px-1.5 py-px text-[10px] font-semibold text-brand">Acción</span>}
    </button>
  )
}

function EventDialog({ event, onClose, onOpenAction }: { event: CalendarEvent | null; onClose: () => void; onOpenAction: (id: string) => void }) {
  const { persona } = usePortal()
  if (!event) return null
  const meta = eventTypeMeta[event.type]
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className={cn("w-fit rounded-full px-2 py-0.5 text-xs font-semibold", meta.chip)}>{meta.label}</span>
          <DialogTitle className="leading-snug">{event.title}</DialogTitle>
          <DialogDescription>{event.description}</DialogDescription>
        </DialogHeader>
        <dl className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 text-muted-foreground" />
            <dd className="first-letter:uppercase">
              {formatLongDate(event.date)}
              {event.endDate && ` al ${formatDate(event.endDate, { day: "numeric", month: "long" })}`}
              {event.time && ` · ${event.time}${event.endTime ? `–${event.endTime}` : ""} h`}
            </dd>
          </div>
          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-muted-foreground" />
              <dd>{event.location}</dd>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 pl-6">
            <CompanyTag companies={event.companies} />
            {event.service && <span className="text-xs text-muted-foreground">{serviceNames[event.service]}</span>}
          </div>
        </dl>
        <DialogFooter>
          {!event.actionItemId && (
            <Button variant="outline" onClick={() => toast.success("Evento agregado a tu calendario (simulado)")}>
              <CalendarPlus />
              Agregar a mi calendario
            </Button>
          )}
          {event.actionItemId && canAccessModule(persona, "pendientes") && (
            <Button onClick={() => onOpenAction(event.actionItemId!)}>Abrir y atender el pendiente</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SubscribeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const url = "webcal://portal.gs.ejemplo.mx/calendario/ecopack-norte/7f3a9c.ics"
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Suscribirte al calendario</DialogTitle>
          <DialogDescription>Ve las fechas del portal en Google Calendar, Outlook o Apple Calendar. La suscripción es de solo lectura: las acciones se completan únicamente dentro del portal.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={url} aria-label="Dirección del calendario" className="font-mono text-xs" />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard?.writeText(url).catch(() => undefined)
              toast.success("Dirección copiada")
            }}
          >
            <Copy />
            Copiar
          </Button>
        </div>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>• Incluye solo las empresas y servicios a los que tienes acceso.</li>
          <li>• Los calendarios externos se actualizan cada pocas horas.</li>
          <li>• Si revocan tu acceso, la dirección deja de funcionar.</li>
        </ul>
      </DialogContent>
    </Dialog>
  )
}
