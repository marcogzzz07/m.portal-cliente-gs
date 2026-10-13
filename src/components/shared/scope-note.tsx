"use client"

import { AlertTriangle, Database } from "lucide-react"

import { integrations } from "@/data/organization"
import { formatDateTime } from "@/lib/format"
import type { IntegrationSource } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"

interface ScopeNoteProps {
  /** Alcance de la cifra: "Grupo EcoPack Norte" o la razón social. */
  scope: string
  period: string
  source: IntegrationSource["key"] | "portal"
  className?: string
}

/**
 * Alcance, periodo y fecha de actualización de una cifra (Product Spec §8):
 * "Ninguna cifra se mostrará sin alcance, periodo y fecha de actualización."
 */
export function ScopeNote({ scope, period, source, className }: ScopeNoteProps) {
  const { state } = usePortal()
  const integration = integrations.find((i) => i.key === source)
  const stale = source === "contalink" && state.demo.contalinkDown
  const sync = integration ? (stale ? integration.fallbackSync : integration.lastSync) : null

  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-snug text-muted-foreground", stale && "text-[color-mix(in_oklch,var(--warning),black_35%)]", className)}>
      {stale ? <AlertTriangle className="size-3 shrink-0" aria-hidden /> : <Database className="size-3 shrink-0" aria-hidden />}
      <span>{scope}</span>
      <span aria-hidden>·</span>
      <span>{period}</span>
      {integration && sync && (
        <>
          <span aria-hidden>·</span>
          <span>
            {integration.name}, {stale ? "última sincronización válida " : "act. "}
            {formatDateTime(sync)}
          </span>
        </>
      )}
      {source === "portal" && (
        <>
          <span aria-hidden>·</span>
          <span>En tiempo real</span>
        </>
      )}
    </p>
  )
}
