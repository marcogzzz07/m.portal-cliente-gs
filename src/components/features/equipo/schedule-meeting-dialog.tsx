"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CalendarCheck, CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin, Send, Video } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Segmented } from "@/components/shared/segmented"
import { UserAvatar } from "@/components/shared/user-avatar"
import { seedEvents } from "@/data/calendar"
import { getPerson, gsTeam, personas } from "@/data/organization"
import { DEMO_TODAY, formatDate, formatLongDate, parseDate } from "@/lib/format"
import type { Meeting, MeetingModality, ServiceKey } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"

const topics: { label: string; service?: ServiceKey }[] = [
  { label: "Revisión de resultados del mes", service: "contabilidad" },
  { label: "Dudas sobre impuestos", service: "impuestos" },
  { label: "Seguimiento de la auditoría", service: "auditoria" },
  { label: "Avance de la escisión", service: "legal" },
  { label: "Planeación 2027" },
  { label: "Otro tema" },
]

const modalityLabel: Record<MeetingModality, string> = {
  video: "Videollamada",
  oficinas_gs: "Oficinas GS",
  oficinas_cliente: "Tus oficinas",
}

const WEEK = ["L", "M", "M", "J", "V", "S", "D"]

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number)
  const t = h * 60 + m + minutes
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
}

const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "16:00", "16:30", "17:00", "17:30"]

/** Archivo .ics real para agregar la reunión a Outlook, Google o Apple Calendar. */
function downloadIcs(m: Meeting) {
  const stamp = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(":", "")}00`
  const host = getPerson(m.hostId)
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Portal de Clientes GS//Prototipo//ES",
    "BEGIN:VEVENT",
    `UID:${m.id}@portal-clientes-gs.ejemplo`,
    `DTSTAMP:${stamp(DEMO_TODAY, "09:00")}`,
    `DTSTART;TZID=America/Monterrey:${stamp(m.date, m.time)}`,
    `DTEND;TZID=America/Monterrey:${stamp(m.date, m.endTime)}`,
    `SUMMARY:${m.topic} · GS`,
    `DESCRIPTION:Reunión con ${host.firstName} ${host.lastName} (González Solís). Prototipo: datos ficticios.`,
    `LOCATION:${m.modality === "video" ? "Videollamada" : m.modality === "oficinas_gs" ? "Oficinas GS, Monterrey" : "Oficinas del cliente"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `Reunion_GS_${m.date}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Persona de GS con quien se agenda (por defecto, el contacto principal). */
  hostId?: string
}

/** Agendar una reunión con GS: fecha, horario disponible, modalidad, tema y asistentes. */
export function ScheduleMeetingDialog({ open, onOpenChange, hostId: initialHost = "mariana" }: Props) {
  const { persona, state, requestMeeting } = usePortal()
  const [hostId, setHostId] = useState(initialHost)
  const [month, setMonth] = useState(DEMO_TODAY.slice(0, 7))
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [duration, setDuration] = useState<"30" | "60">("60")
  const [modality, setModality] = useState<MeetingModality>("video")
  const [topic, setTopic] = useState(topics[0].label)
  const [notes, setNotes] = useState("")
  const [attendees, setAttendees] = useState<string[]>([persona.personId])
  const [sent, setSent] = useState<Meeting | null>(null)

  const host = getPerson(hostId)
  const member = gsTeam.find((g) => g.personId === hostId)
  const live = sent ? state.meetings.find((m) => m.id === sent.id) ?? sent : null

  const [y, mo] = month.split("-").map(Number)
  const first = new Date(y, mo - 1, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(y, mo, 0).getDate()
  const cells = Array.from({ length: offset + daysInMonth }, (_, i) => (i < offset ? null : iso(new Date(y, mo - 1, i - offset + 1))))

  function dayDisabled(d: string) {
    const dow = parseDate(d).getDay()
    if (d <= DEMO_TODAY || dow === 0 || dow === 6) return true
    if (member?.away && d >= member.away.from && d <= member.away.to) return true
    return false
  }

  const busy = useMemo(() => {
    if (!date) return new Set<string>()
    const taken = new Set<string>()
    for (const s of SLOTS) if (hash(`${hostId}-${date}-${s}`) < 0.32) taken.add(s)
    for (const e of seedEvents) if (e.date === date && e.time) taken.add(e.time)
    for (const m of state.meetings) if (m.date === date && m.status !== "cancelada") taken.add(m.time)
    return taken
  }, [date, hostId, state.meetings])

  function reset() {
    setDate(null)
    setTime(null)
    setNotes("")
    setSent(null)
    setMonth(DEMO_TODAY.slice(0, 7))
  }

  function submit() {
    if (!date || !time) return
    const t = topics.find((x) => x.label === topic)
    const meeting = requestMeeting({
      topic,
      notes: notes.trim() || undefined,
      date,
      time,
      endTime: addMinutes(time, Number(duration)),
      modality,
      hostId,
      gsAttendees: [hostId],
      clientAttendees: attendees,
      companies: state.scope === "grupo" ? persona.companies : [state.scope],
      service: t?.service,
    })
    setSent(meeting)
    toast.success(`Solicitud enviada a ${host.firstName}`, { description: "Recibirás la confirmación en el portal y por correo." })
  }

  const clientPeople = personas.filter((p) => p.companies.some((c) => persona.companies.includes(c))).map((p) => getPerson(p.personId))

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-h-[94dvh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        {live ? (
          <div className="space-y-6 p-6 sm:p-8">
            <DialogHeader className="items-center text-center">
              <span className={cn("flex size-14 items-center justify-center rounded-full", live.status === "confirmada" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground")}>
                {live.status === "confirmada" ? <CalendarCheck className="size-6" /> : <Clock className="size-6" />}
              </span>
              <DialogTitle className="text-xl">{live.status === "confirmada" ? "Reunión confirmada" : "Solicitud enviada"}</DialogTitle>
              <DialogDescription>
                {live.status === "confirmada" ? `${host.firstName} confirmó la reunión. Ya aparece en tu calendario.` : `Esperando la confirmación de ${host.firstName}…`}
              </DialogDescription>
            </DialogHeader>
            <dl className="mx-auto grid max-w-md gap-3 rounded-2xl bg-muted/60 p-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tema</dt>
                <dd className="text-right font-medium">{live.topic}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Fecha</dt>
                <dd className="text-right font-medium first-letter:uppercase">{formatLongDate(live.date)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Horario</dt>
                <dd className="text-right font-medium">
                  {live.time} – {live.endTime} h
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Modalidad</dt>
                <dd className="text-right font-medium">{modalityLabel[live.modality]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Con</dt>
                <dd className="text-right font-medium">
                  {host.firstName} {host.lastName}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => downloadIcs(live)}>
                <CalendarPlus />
                Agregar a Outlook o Google
              </Button>
              <Button asChild onClick={() => onOpenChange(false)}>
                <Link href="/calendario">Ver en el calendario</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle>Agendar una reunión con GS</DialogTitle>
              <DialogDescription>Elige día y horario disponibles. GS confirmará y la reunión aparecerá en tu calendario.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 px-6 py-5 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
              {/* Con quién y cuándo */}
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label>Con</Label>
                  <Select
                    value={hostId}
                    onValueChange={(v) => {
                      setHostId(v)
                      setTime(null)
                    }}
                  >
                    <SelectTrigger className="w-full min-w-0 data-[size=default]:h-10 *:data-[slot=select-value]:truncate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gsTeam.map((g) => {
                        const p = getPerson(g.personId)
                        return (
                          <SelectItem key={g.personId} value={g.personId}>
                            {p.firstName} {p.lastName} · {g.area}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {member?.away && <p className="text-xs text-muted-foreground">Ausente del {formatDate(member.away.from)} al {formatDate(member.away.to)}.</p>}
                </div>

                <div className="rounded-2xl bg-muted/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Button variant="ghost" size="icon-sm" disabled={month <= DEMO_TODAY.slice(0, 7)} onClick={() => setMonth(iso(new Date(y, mo - 2, 1)).slice(0, 7))} aria-label="Mes anterior">
                      <ChevronLeft />
                    </Button>
                    <p className="text-sm font-medium first-letter:uppercase">{formatDate(`${month}-01`, { month: "long", year: "numeric" })}</p>
                    <Button variant="ghost" size="icon-sm" disabled={month >= "2026-12"} onClick={() => setMonth(iso(new Date(y, mo, 1)).slice(0, 7))} aria-label="Mes siguiente">
                      <ChevronRight />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
                    {WEEK.map((d, i) => (
                      <span key={i} className="py-1">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((d, i) =>
                      d ? (
                        <button
                          key={d}
                          type="button"
                          disabled={dayDisabled(d)}
                          onClick={() => {
                            setDate(d)
                            setTime(null)
                          }}
                          aria-pressed={date === d}
                          aria-label={formatLongDate(d)}
                          className={cn(
                            "aspect-square rounded-lg text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                            date === d ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-card",
                            d === DEMO_TODAY && date !== d && "font-semibold text-brand",
                            dayDisabled(d) && "cursor-default text-muted-foreground/40 hover:bg-transparent"
                          )}
                        >
                          {Number(d.slice(8))}
                        </button>
                      ) : (
                        <span key={`e-${i}`} />
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Horario y detalles */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label>{date ? <span className="first-letter:uppercase">{formatLongDate(date)}</span> : "Horarios disponibles"}</Label>
                    <Segmented label="Duración" value={duration} onChange={setDuration} options={[{ value: "30", label: "30 min" }, { value: "60", label: "1 hora" }]} />
                  </div>
                  {date ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {SLOTS.map((s) => {
                        const taken = busy.has(s)
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={taken}
                            onClick={() => setTime(s)}
                            aria-pressed={time === s}
                            className={cn(
                              "h-10 rounded-xl border text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                              time === s ? "border-primary bg-primary font-medium text-primary-foreground" : "bg-card hover:border-foreground/30",
                              taken && "cursor-default border-dashed text-muted-foreground/50 line-through hover:border-border"
                            )}
                          >
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">Elige un día en el calendario para ver los horarios de {host.firstName}.</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label>Tema</Label>
                    <Select value={topic} onValueChange={setTopic}>
                      <SelectTrigger className="w-full min-w-0 data-[size=default]:h-10 *:data-[slot=select-value]:truncate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((t) => (
                          <SelectItem key={t.label} value={t.label}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Modalidad</Label>
                    <Select value={modality} onValueChange={(v) => setModality(v as MeetingModality)}>
                      <SelectTrigger className="w-full min-w-0 data-[size=default]:h-10 *:data-[slot=select-value]:truncate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Videollamada</SelectItem>
                        <SelectItem value="oficinas_gs">Presencial en oficinas GS</SelectItem>
                        <SelectItem value="oficinas_cliente">Presencial en tus oficinas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Asistentes de tu empresa</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {clientPeople.map((p) => (
                      <label key={p.id} className="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm">
                        <Checkbox
                          checked={attendees.includes(p.id)}
                          onCheckedChange={(v) => setAttendees((a) => (v ? [...a, p.id] : a.filter((x) => x !== p.id)))}
                          disabled={p.id === persona.personId}
                        />
                        <UserAvatar firstName={p.firstName} lastName={p.lastName} size="sm" />
                        <span className="min-w-0 flex-1 truncate">
                          {p.firstName} {p.lastName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="mtg-notes">Agenda o comentarios (opcional)</Label>
                  <Textarea id="mtg-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Revisar el margen de Comercial y el escenario de precios." />
                </div>
              </div>
            </div>

            <DialogFooter className="items-center border-t px-6 py-4 sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                {modality === "video" ? <Video className="size-4" /> : <MapPin className="size-4" />}
                {date && time ? (
                  <span>
                    {formatDate(date, { weekday: "short", day: "numeric", month: "short" })} · {time}–{addMinutes(time, Number(duration))} h con {host.firstName}
                  </span>
                ) : (
                  "Elige día y horario"
                )}
              </p>
              <Button onClick={submit} disabled={!date || !time}>
                <Send />
                Enviar solicitud
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
