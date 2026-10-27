"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Building2, CalendarClock, CalendarDays, FolderOpen, ListChecks, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AccessDenied } from "@/components/shared/access-denied"
import { PersonChip } from "@/components/shared/person-chip"
import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { companies } from "@/data/organization"
import { news } from "@/data/news"
import { formatDate } from "@/lib/format"
import { canAccessModule } from "@/lib/permissions"
import type { NewsItem } from "@/lib/types"
import { usePortal } from "@/store/portal-store"
import { ScheduleMeetingDialog } from "../equipo/schedule-meeting-dialog"
import { impactMeta } from "./news-meta"

const actionIcon: Record<NonNullable<NewsItem["action"]>["kind"], typeof MessageSquare> = {
  conversar: MessageSquare,
  agendar: CalendarClock,
  pendiente: ListChecks,
  calendario: CalendarDays,
  documentos: FolderOpen,
}

/** Nota completa: imagen, cuerpo, "Por qué te importa" y la acción recomendada por GS. */
export function NewsDetail({ id }: { id: string }) {
  const router = useRouter()
  const { persona, can, readNews, createConversation } = usePortal()
  const [schedule, setSchedule] = useState(false)
  const item = news.find((n) => n.id === id)

  useEffect(() => {
    if (item) readNews(item.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id])

  if (!canAccessModule(persona, "novedades")) return <AccessDenied />
  if (!item) return <AccessDenied title="Novedad no encontrada" description="Es posible que el enlace sea incorrecto o que la nota se haya retirado." />

  const related = news.filter((n) => n.id !== item.id && (n.category === item.category || n.companies.some((c) => item.companies.includes(c)))).slice(0, 3)
  const Icon = item.action ? actionIcon[item.action.kind] : MessageSquare

  function runAction() {
    const a = item!.action
    if (!a) return
    switch (a.kind) {
      case "agendar":
        return setSchedule(true)
      case "pendiente":
        return router.push(`/pendientes/${a.ref}`)
      case "calendario":
        return router.push("/calendario")
      case "documentos":
        return router.push("/documentos")
      case "conversar": {
        const convId = createConversation(
          { subject: item!.title, context: { type: "general", label: `Novedad: ${item!.title}` }, companies: item!.companies, service: item!.services[0], gsOwnerId: a.ref ?? item!.authorId },
          `Leí la nota “${item!.title}” y me gustaría revisar cómo nos afecta.`
        )
        return router.push(`/mensajes/${convId}`)
      }
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/novedades">
          <ArrowLeft />
          Novedades
        </Link>
      </Button>

      <div className="relative aspect-[21/9] overflow-hidden rounded-xl bg-muted sm:aspect-[4/1]">
        <Image src={item.image} alt={item.imageAlt} fill sizes="(min-width: 1400px) 1300px, 100vw" className="object-cover" priority />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-w-0 space-y-5 rounded-xl bg-card p-4 border sm:p-5">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <span>{item.category}</span>
            <span aria-hidden>·</span>
            <span>{formatDate(item.date, { day: "numeric", month: "long", year: "numeric" })}</span>
            <span aria-hidden>·</span>
            <span>{item.readMinutes} min de lectura</span>
            <StatusBadge {...impactMeta[item.impact]} className="ml-1" />
          </div>
          <h1 className="text-2xl leading-tight font-bold tracking-tight sm:text-[28px]">{item.title}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{item.summary}</p>
          <div className="space-y-4 border-t pt-5 text-[15px] leading-7">
            {item.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <PersonChip id={item.authorId} showTitle size="md" />
            <p className="text-xs text-muted-foreground">Revisado por GS · Contenido ilustrativo para el prototipo</p>
          </div>
        </article>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-[var(--gs-radius-md)] bg-muted px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Por qué te importa</p>
            <p className="mt-2 text-[15px] leading-relaxed">{item.whyItMatters}</p>
          </div>

          {item.action && can.respond && (
            <SectionCard title="Acción recomendada" icon={Icon}>
              <Button className="w-full" onClick={runAction}>
                {item.action.label}
                <ArrowRight />
              </Button>
            </SectionCard>
          )}

          <SectionCard title="Aplica a" icon={Building2}>
            <ul className="space-y-1.5 text-sm">
              {item.companies.map((c) => (
                <li key={c}>{companies.find((x) => x.id === c)!.name}</li>
              ))}
            </ul>
            {item.validUntil && <p className="mt-3 text-xs text-muted-foreground">Vigente hasta el {formatDate(item.validUntil, { day: "numeric", month: "long", year: "numeric" })}.</p>}
          </SectionCard>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-medium">También te puede interesar</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((n) => (
              <Link key={n.id} href={`/novedades/${n.id}`} className="group flex gap-4 rounded-xl bg-card p-3 border transition-shadow hover:shadow-[0_4px_14px_rgba(24,25,27,0.10)]">
                <span className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl">
                  <Image src={n.image} alt={n.imageAlt} fill sizes="96px" className="object-cover" />
                </span>
                <span className="min-w-0 space-y-1 py-1">
                  <span className="block text-[13px] text-muted-foreground">
                    {n.category} · {formatDate(n.date)}
                  </span>
                  <span className="line-clamp-3 text-sm leading-snug font-medium">{n.title}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {schedule && item.action?.ref && <ScheduleMeetingDialog open hostId={item.action.ref} onOpenChange={setSchedule} />}
    </div>
  )
}
