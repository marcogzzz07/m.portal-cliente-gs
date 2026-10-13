"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, MessagesSquare, Paperclip, PenSquare, RotateCcw, Search, Send, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AccessDenied } from "@/components/shared/access-denied"
import { CompanyTag } from "@/components/shared/company-tag"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { getPerson, serviceNames } from "@/data/organization"
import { useScopedData } from "@/hooks/use-scoped-data"
import { formatDate, formatRelative } from "@/lib/format"
import { canAccessModule, canSeeConversation } from "@/lib/permissions"
import type { Conversation, ServiceKey } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"
import { ContextChip, contextMeta } from "./context-chip"
import { NewConversationDialog } from "./new-conversation-dialog"

type StatusFilter = "abierta" | "resuelta" | "todas"

/** Mensajes (Product Spec §16): hilos con contexto, responsable GS y estado abierto/resuelto. */
export function MessagesView({ threadId, compose = false }: { threadId?: string; compose?: boolean }) {
  const router = useRouter()
  const { persona, state } = usePortal()
  const { conversations, scopeLabel } = useScopedData()
  const [status, setStatus] = useState<StatusFilter>("abierta")
  const [service, setService] = useState<ServiceKey | "todos">("todos")
  const [query, setQuery] = useState("")
  const [newOpen, setNewOpen] = useState(compose)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations
      .filter((c) => status === "todas" || c.status === status)
      .filter((c) => service === "todos" || c.service === service)
      .filter((c) => !q || `${c.subject} ${c.context.label} ${c.messages.map((m) => m.text).join(" ")}`.toLowerCase().includes(q))
      .sort((a, b) => (b.messages.at(-1)?.at ?? "").localeCompare(a.messages.at(-1)?.at ?? ""))
  }, [conversations, status, service, query])

  if (!canAccessModule(persona, "mensajes")) return <AccessDenied />

  // El hilo puede estar fuera del contexto activo; se respeta el permiso, no el filtro.
  const thread = threadId ? state.conversations.find((c) => c.id === threadId) : undefined
  const threadAllowed = thread && canSeeConversation(persona, thread)

  return (
    <div>
      <div className="grid h-[calc(100dvh-9rem)] min-h-[520px] overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.06] lg:h-[calc(100dvh-7rem)] xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Bandeja */}
        <aside className={cn("flex min-h-0 flex-col border-r", threadId && "hidden xl:flex")}>
          <div className="space-y-3 border-b p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Mensajes</h1>
                <p className="text-xs text-muted-foreground">{scopeLabel}</p>
              </div>
              {persona.role !== "consulta" && (
                <Button size="sm" onClick={() => setNewOpen(true)}>
                  <PenSquare />
                  Nueva
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en conversaciones" className="h-8 pl-8" aria-label="Buscar en conversaciones" />
            </div>
            <div className="flex gap-2">
              <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <SelectTrigger size="sm" className="flex-1" aria-label="Estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abierta">Abiertas</SelectItem>
                  <SelectItem value="resuelta">Resueltas</SelectItem>
                  <SelectItem value="todas">Todas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={service} onValueChange={(v) => setService(v as ServiceKey | "todos")}>
                <SelectTrigger size="sm" className="flex-1" aria-label="Servicio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los servicios</SelectItem>
                  {(["contabilidad", "impuestos", "auditoria", "legal", "facturacion"] as ServiceKey[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {serviceNames[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
            {list.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No hay conversaciones con estos filtros.</li>}
            {list.map((c) => (
              <ThreadItem key={c.id} conv={c} active={c.id === threadId} />
            ))}
          </ul>
        </aside>

        {/* Hilo */}
        <section className={cn("flex min-h-0 min-w-0 flex-col", !threadId && "hidden xl:flex")}>
          {!threadId ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState icon={MessagesSquare} title="Elige una conversación" description="Cada conversación está ligada a un documento, pendiente, factura, insight o proyecto, y tiene un responsable en GS." className="border-0 bg-transparent" />
            </div>
          ) : !thread ? (
            <div className="p-6">
              <AccessDenied title="Conversación no encontrada" />
            </div>
          ) : !threadAllowed ? (
            <div className="p-6">
              <AccessDenied description="No participas en esta conversación y tu rol no permite verla." />
            </div>
          ) : (
            <Thread conv={thread} />
          )}
        </section>
      </div>

      <NewConversationDialog open={newOpen} onOpenChange={setNewOpen} onCreated={(id) => router.push(`/mensajes/${id}`)} />
    </div>
  )
}

function ThreadItem({ conv, active }: { conv: Conversation; active: boolean }) {
  const last = conv.messages.at(-1)!
  const author = getPerson(last.authorId)
  const unread = conv.messages.length - conv.readUpTo
  return (
    <li>
      <Link href={`/mensajes/${conv.id}`} aria-current={active ? "page" : undefined} className={cn("flex gap-3 px-5 py-4 transition-colors hover:bg-muted/50", active && "bg-muted")}>
        <UserAvatar firstName={getPerson(conv.gsOwnerId).firstName} lastName={getPerson(conv.gsOwnerId).lastName} highlight size="md" />
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex items-baseline gap-2">
            <span className={cn("flex-1 truncate text-sm", unread > 0 ? "font-bold" : "font-medium")}>{conv.subject}</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelative(last.at)}</span>
          </span>
          <span className="block truncate text-[13px] text-muted-foreground">
            {contextMeta[conv.context.type].label} · {conv.context.label}
          </span>
          <span className="flex items-center gap-2">
            <span className={cn("line-clamp-1 flex-1 text-xs", unread > 0 ? "text-foreground" : "text-muted-foreground")}>
              {author.firstName}: {last.text}
            </span>
            {unread > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">{unread}</span>}
            {conv.status === "resuelta" && <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-label="Resuelta" />}
          </span>
        </span>
      </Link>
    </li>
  )
}

function Thread({ conv }: { conv: Conversation }) {
  const { persona, can, typing, sendMessage, setConversationStatus, markConversationRead } = usePortal()
  const [text, setText] = useState("")
  const [attachment, setAttachment] = useState<{ name: string; size: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingId = typing[conv.id]
  const gsOwner = getPerson(conv.gsOwnerId)

  useEffect(() => {
    markConversationRead(conv.id)
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id, conv.messages.length, typingId])

  function send() {
    if (!text.trim() && !attachment) return
    sendMessage(conv.id, text.trim() || "Adjunto el archivo.", attachment ? [attachment] : undefined)
    setText("")
    setAttachment(null)
  }

  return (
    <>
      <header className="space-y-2 border-b p-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="icon-sm" asChild className="xl:hidden">
            <Link href="/mensajes" aria-label="Volver a la bandeja">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold leading-snug">{conv.subject}</h2>
              <StatusBadge label={conv.status === "abierta" ? "Abierta" : "Resuelta"} tone={conv.status === "abierta" ? "info" : "success"} />
            </div>
            <ContextChip context={conv.context} link />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <CompanyTag companies={conv.companies} />
              <span>{serviceNames[conv.service]}</span>
              <span>
                Responsable GS: <span className="font-medium text-foreground">{gsOwner.firstName} {gsOwner.lastName}</span>
              </span>
              <span className="flex -space-x-1.5" aria-label={`${conv.participants.length} participantes`}>
                {conv.participants.map((p) => (
                  <UserAvatar key={p} firstName={getPerson(p).firstName} lastName={getPerson(p).lastName} size="sm" highlight={getPerson(p).org === "gs"} className="size-5 text-[8px] ring-2 ring-card" />
                ))}
              </span>
            </div>
          </div>
          {can.respond && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConversationStatus(conv.id, conv.status === "abierta" ? "resuelta" : "abierta")
                toast.success(conv.status === "abierta" ? "Conversación marcada como resuelta" : "Conversación reabierta")
              }}
              className="hidden sm:inline-flex"
            >
              {conv.status === "abierta" ? <CheckCircle2 /> : <RotateCcw />}
              {conv.status === "abierta" ? "Resolver" : "Reabrir"}
            </Button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted/30 p-3 sm:p-5" role="log" aria-live="polite">
        {conv.messages.map((m, i) => {
          const author = getPerson(m.authorId)
          const mine = m.authorId === persona.personId
          const day = m.at.slice(0, 10)
          const showDay = i === 0 || conv.messages[i - 1].at.slice(0, 10) !== day
          return (
            <div key={m.id}>
              {showDay && (
                <p className="mb-3 text-center text-[11px] font-medium text-muted-foreground first-letter:uppercase">{formatDate(day, { weekday: "long", day: "numeric", month: "long" })}</p>
              )}
              <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                {!mine && <UserAvatar firstName={author.firstName} lastName={author.lastName} size="sm" highlight={author.org === "gs"} />}
                <div className={cn("max-w-[85%] space-y-1 sm:max-w-[70%]", mine && "items-end text-right")}>
                  {!mine && (
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {author.firstName} {author.lastName}
                      </span>{" "}
                      · {author.org === "gs" ? `GS · ${author.title}` : author.title}
                    </p>
                  )}
                  <div className={cn("rounded-2xl px-3.5 py-2.5 text-left text-sm whitespace-pre-line shadow-xs", mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card")}>
                    {m.text}
                    {m.attachments?.map((a) => (
                      <span key={a.name} className={cn("mt-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs", mine ? "bg-white/10" : "bg-muted")}>
                        <Paperclip className="size-3.5" />
                        <span className="flex-1 truncate">{a.name}</span>
                        <span className="opacity-70">{a.size}</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{m.at.split("T")[1]}</p>
                </div>
              </div>
            </div>
          )
        })}
        {typingId && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserAvatar firstName={getPerson(typingId).firstName} lastName={getPerson(typingId).lastName} size="sm" highlight />
            <span className="flex gap-1 rounded-full bg-card px-3 py-2 shadow-xs" aria-label={`${getPerson(typingId).firstName} está escribiendo`}>
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </span>
            {getPerson(typingId).firstName} está escribiendo…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {can.respond ? (
        <div className="border-t p-3">
          {conv.status === "resuelta" && <p className="mb-2 text-xs text-muted-foreground">Esta conversación está resuelta. Si escribes, se reabrirá.</p>}
          {attachment && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs">
              <Paperclip className="size-3.5" />
              <span className="flex-1 truncate">{attachment.name}</span>
              <span className="text-muted-foreground">{attachment.size}</span>
              <button type="button" onClick={() => setAttachment(null)} aria-label="Quitar adjunto">
                <X className="size-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} aria-label="Adjuntar archivo">
              <Paperclip />
            </Button>
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setAttachment({ name: f.name, size: f.size > 1_048_576 ? `${(f.size / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB` })
              }}
            />
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder={`Escribe a ${gsOwner.firstName}…`}
              className="max-h-32 min-h-9 flex-1 resize-none"
              aria-label="Mensaje"
            />
            <Button size="icon" onClick={send} disabled={!text.trim() && !attachment} aria-label="Enviar">
              <Send />
            </Button>
          </div>
          <p className="mt-1.5 hidden text-[11px] text-muted-foreground sm:block">Enter para enviar · Mayús + Enter para salto de línea. La conversación queda registrada en el portal.</p>
        </div>
      ) : (
        <p className="border-t p-3 text-center text-xs text-muted-foreground">Tu rol es de solo consulta: puedes leer, pero no responder.</p>
      )}
    </>
  )
}
