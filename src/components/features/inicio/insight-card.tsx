"use client"

import { useRouter } from "next/navigation"
import { BadgeCheck, Lightbulb, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CompanyTag } from "@/components/shared/company-tag"
import { getPerson, integrations } from "@/data/organization"
import { formatDate } from "@/lib/format"
import type { InsightPreview } from "@/lib/types"
import { usePortal } from "@/store/portal-store"

/** Insight consultivo: dato, interpretación y recomendación separados, con fuente y aprobación de GS. */
export function InsightCard({ insight }: { insight: InsightPreview }) {
  const router = useRouter()
  const { state, createConversation, can } = usePortal()
  const approver = getPerson(insight.approvedBy)
  const stale = insight.source === "ContaLink" && state.demo.contalinkDown

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
    <article className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100">
          <Lightbulb className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <h3 className="font-semibold leading-snug">{insight.title}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums">{insight.signal}</span>
            {insight.preliminary && <span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-xs font-medium text-[color-mix(in_oklch,var(--warning),black_35%)]">Cifra preliminar</span>}
            <CompanyTag companies={insight.companies} />
          </div>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">Qué pasa</dt>
          <dd>{insight.explanation}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">Impacto estimado</dt>
          <dd>{insight.impact}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">Recomendación de GS</dt>
          <dd className="font-medium">{insight.recommendation}</dd>
        </div>
      </dl>

      <div className="mt-auto space-y-3 border-t pt-3">
        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <BadgeCheck className="mt-px size-3.5 shrink-0 text-success" />
          <span>
            Aprobado por {approver.firstName} {approver.lastName} ({approver.title}) el {formatDate(insight.approvedAt)} · Fuente: {insight.source}
            {stale && `, última sincronización válida ${integrations.find((i) => i.name === insight.source)?.fallbackSync.replace("T", " ")}`} · {insight.period}
          </span>
        </p>
        {can.respond && (
          <Button variant="outline" size="sm" onClick={talk} className="w-full sm:w-auto">
            <MessageSquare />
            Conversar sobre esto
          </Button>
        )}
      </div>
    </article>
  )
}
