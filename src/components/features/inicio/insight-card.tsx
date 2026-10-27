"use client"

import { useRouter } from "next/navigation"
import { BadgeCheck, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getPerson, integrations, serviceNames } from "@/data/organization"
import { formatDate } from "@/lib/format"
import { companiesLabel } from "@/lib/labels"
import type { InsightPreview } from "@/lib/types"
import { usePortal } from "@/store/portal-store"

/** Insight consultivo: dato, interpretación y recomendación separados, con fuente y aprobación de GS. */
export function InsightCard({ insight }: { insight: InsightPreview }) {
  const router = useRouter()
  const { state, createConversation, can } = usePortal()
  const approver = getPerson(insight.approvedBy)
  const stale = insight.source === "ContaLink" && state.demo.contalinkDown
  const sync = integrations.find((i) => i.name === insight.source)

  function talk() {
    const existing = insight.conversationId && state.conversations.find((c) => c.id === insight.conversationId)
    if (existing) return router.push(`/mensajes/${existing.id}`)
    const id = createConversation(
      { subject: insight.title, context: { type: "insight", refId: insight.id, label: `Insight: ${insight.title}` }, companies: insight.companies, service: insight.service, gsOwnerId: insight.approvedBy },
      "Me gustaría revisar este análisis con ustedes."
    )
    router.push(`/mensajes/${id}`)
  }

  return (
    <article className="flex h-full flex-col gap-4 rounded-[var(--gs-radius-lg)] border bg-card px-4 py-3.5 text-sm">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {companiesLabel(insight.companies)} · {serviceNames[insight.service]}
        </p>
        <h3 className="text-base leading-snug font-semibold">{insight.title}</h3>
        <p className="flex items-baseline gap-2">
          <span className="text-[1.625rem] leading-tight font-bold tracking-tight tabular-nums">{insight.signal}</span>
          {insight.preliminary && <span className="text-xs text-muted-foreground">cifra preliminar</span>}
        </p>
      </div>

      <dl className="space-y-2.5 text-sm leading-relaxed">
        <div>
          <dt className="text-xs text-muted-foreground">Qué pasa</dt>
          <dd>{insight.explanation}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Impacto estimado</dt>
          <dd>{insight.impact}</dd>
        </div>
        <div className="rounded-[var(--gs-radius-md)] bg-muted px-3 py-2">
          <dt className="text-xs text-muted-foreground">Recomendación de GS</dt>
          <dd className="font-medium">{insight.recommendation}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <BadgeCheck className="mt-px size-3.5 shrink-0 text-success" />
          <span>
            Aprobado por {approver.firstName} {approver.lastName}, {formatDate(insight.approvedAt)}
            <br />
            {insight.source}
            {stale && sync ? `, última sincronización válida ${formatDate(sync.fallbackSync.slice(0, 10))}` : ""} · {insight.period}
          </span>
        </p>
        {can.respond && (
          <Button variant="outline" size="sm" onClick={talk}>
            <MessageSquare />
            Conversar
          </Button>
        )}
      </div>
    </article>
  )
}
