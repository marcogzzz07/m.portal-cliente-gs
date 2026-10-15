"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Newspaper } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { AccessDenied } from "@/components/shared/access-denied"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Segmented } from "@/components/shared/segmented"
import { StatusBadge } from "@/components/shared/status-badge"
import { getPerson } from "@/data/organization"
import { news } from "@/data/news"
import { useScopedData } from "@/hooks/use-scoped-data"
import { formatDate } from "@/lib/format"
import { canAccessModule, matchesScope } from "@/lib/permissions"
import type { NewsItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"
import { impactMeta } from "./news-meta"

type Category = "todas" | NewsItem["category"]

/** Novedades curadas por GS (Product Spec §18): segmentadas por empresa y servicio, con "Por qué te importa". */
export function NewsView() {
  const { persona, state } = usePortal()
  const { scope, scopeBadge, scopeLabel } = useScopedData()
  const [category, setCategory] = useState<Category>("todas")
  const [onlyMine, setOnlyMine] = useState(true)

  if (!canAccessModule(persona, "novedades")) return <AccessDenied />

  const relevant = (n: NewsItem) => matchesScope(n.companies, scope, persona.companies)
  const list = news
    .filter((n) => category === "todas" || n.category === category)
    .filter((n) => !onlyMine || relevant(n))
    .sort((a, b) => b.date.localeCompare(a.date))
  const featured = list.find((n) => n.impact === "alto") ?? list[0]
  const rest = list.filter((n) => n.id !== featured?.id)
  const unread = news.filter((n) => relevant(n) && !state.newsRead.includes(n.id)).length

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Newspaper}
        title="Novedades"
        badge={scopeBadge}
        description={`Cambios fiscales, legales y laborales seleccionados por GS, con lo que significan para ${scopeLabel}.${unread ? ` Tienes ${unread} sin leer.` : ""}`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Categoría"
          value={category}
          onChange={setCategory}
          options={[
            { value: "todas", label: "Todas" },
            { value: "Fiscal", label: "Fiscal" },
            { value: "Legal", label: "Legal" },
            { value: "Laboral", label: "Laboral" },
            { value: "Contable", label: "Contable" },
          ]}
          className="max-w-full overflow-x-auto"
        />
        <div className="flex items-center gap-2.5">
          <Switch id="only-mine" checked={onlyMine} onCheckedChange={setOnlyMine} />
          <Label htmlFor="only-mine" className="font-normal">
            Solo lo que aplica a {scope === "grupo" ? "mis empresas" : scopeLabel}
          </Label>
        </div>
      </div>

      {!featured ? (
        <EmptyState icon={Newspaper} title="Sin novedades en esta categoría" description="Prueba con otra categoría o desactiva el filtro de empresa." />
      ) : (
        <>
          <Link href={`/novedades/${featured.id}`} className="group grid overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.06] transition-shadow hover:shadow-md lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-80">
              <Image src={featured.image} alt={featured.imageAlt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" priority />
            </div>
            <div className="flex flex-col gap-4 p-6 sm:p-8">
              <p className="text-[13px] text-muted-foreground">
                Destacado · {featured.category} · {formatDate(featured.date, { day: "numeric", month: "long" })}
              </p>
              <h2 className="text-2xl leading-tight font-bold tracking-tight">{featured.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{featured.summary}</p>
              <div className="rounded-xl bg-brand-soft/60 px-4 py-3 text-sm leading-relaxed">
                <p className="text-[13px] font-medium text-brand">Por qué te importa</p>
                <p>{featured.whyItMatters}</p>
              </div>
              <p className="mt-auto flex items-center gap-1.5 text-sm font-medium">
                Leer la nota completa <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          </Link>

          {rest.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rest.map((n) => (
                <NewsCard key={n.id} item={n} unread={!state.newsRead.includes(n.id)} dimmed={!relevant(n)} />
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">Contenido ilustrativo para el prototipo. Fotografías: Unsplash.</p>
    </div>
  )
}

function NewsCard({ item, unread, dimmed }: { item: NewsItem; unread: boolean; dimmed: boolean }) {
  const author = getPerson(item.authorId)
  return (
    <Link href={`/novedades/${item.id}`} className={cn("group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.06] transition-shadow hover:shadow-md", dimmed && "opacity-70")}>
      <div className="relative aspect-[16/9]">
        <Image src={item.image} alt={item.imageAlt} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          {unread && <span className="size-2 rounded-full bg-brand" aria-label="Sin leer" />}
          {item.category} · {formatDate(item.date, { day: "numeric", month: "long" })} · {item.readMinutes} min
        </p>
        <h3 className="text-[17px] leading-snug font-semibold">{item.title}</h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
          <span className="truncate text-[13px] text-muted-foreground">
            {author.firstName} {author.lastName} · {item.area}
          </span>
          <StatusBadge {...impactMeta[item.impact]} />
        </div>
      </div>
    </Link>
  )
}
