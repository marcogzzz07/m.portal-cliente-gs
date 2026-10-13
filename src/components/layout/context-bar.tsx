"use client"

import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { companies, group, integrations } from "@/data/organization"
import { formatDateTime } from "@/lib/format"
import type { Scope } from "@/lib/types"
import { usePortal } from "@/store/portal-store"

/**
 * Contexto activo (Product Spec §8 y Benchmark: patrón multi-entidad de Brex).
 * Va arriba de cada página, como la tarjeta de filtros de los demás módulos del Portal GS.
 */
export function ContextBar() {
  const { state, allowed, setScope } = usePortal()
  const options = companies.filter((c) => allowed.includes(c.id))
  const canGroup = options.length > 1
  const current = state.scope === "grupo" ? null : companies.find((c) => c.id === state.scope)
  const stale = state.demo.contalinkDown
  const sources = integrations.filter((i) => i.key !== "auditbrain")

  function choose(next: Scope) {
    setScope(next)
    toast(next === "grupo" ? `Viendo ${group.name}` : `Viendo ${companies.find((c) => c.id === next)!.name}`, {
      description: "Cifras, pendientes y documentos se ajustaron al nuevo contexto.",
      duration: 2500,
    })
  }

  return (
    <section aria-label="Contexto" className="mb-6 grid gap-x-8 gap-y-4 rounded-2xl bg-card p-4 sm:p-5 ring-1 ring-foreground/[0.06] sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)] sm:items-end xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_auto]">
      <div className="grid gap-1.5">
        <Label htmlFor="ctx-empresa" className="text-xs font-normal text-muted-foreground">
          Empresa
        </Label>
        <Select value={state.scope} onValueChange={(v) => choose(v as Scope)} disabled={!canGroup}>
          <SelectTrigger id="ctx-empresa" className="w-full bg-background text-[15px] data-[size=default]:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {canGroup && (
              <>
                <SelectItem value="grupo">Grupo completo · {group.shortName}</SelectItem>
                <SelectSeparator />
              </>
            )}
            <SelectGroup>
              <SelectLabel>Razones sociales</SelectLabel>
              {options.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden min-w-0 gap-1.5 xl:grid">
        <span className="text-xs text-muted-foreground">{current ? "Razón social" : "Grupo"}</span>
        <p className="flex h-10 items-center truncate text-[15px]">
          {current ? (
            <>
              {current.legalName}
              <span className="ml-2 hidden text-sm text-muted-foreground xl:inline">RFC {current.rfc}</span>
            </>
          ) : (
            `${group.name} · ${options.length} razones sociales`
          )}
        </p>
      </div>

      <div className="hidden gap-1.5 sm:grid sm:text-right">
        <span className="text-xs text-muted-foreground">Última actualización</span>
        <p className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:justify-end">
          {sources.map((s) => {
            const down = stale && s.key === "contalink"
            return (
              <span key={s.key} className={down ? "inline-flex items-center gap-1 font-medium text-[color-mix(in_oklch,var(--warning),black_35%)]" : "text-muted-foreground"}>
                {down && <AlertTriangle className="size-3.5" />}
                <span className="text-foreground">{s.name}</span> {formatDateTime(down ? s.fallbackSync : s.lastSync).split(", ")[1]}
                {down && " (ayer)"}
              </span>
            )
          })}
        </p>
      </div>
    </section>
  )
}
