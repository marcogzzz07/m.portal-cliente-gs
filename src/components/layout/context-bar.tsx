"use client"

import { Building2, Layers } from "lucide-react"
import { toast } from "sonner"

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { companies, group } from "@/data/organization"
import type { Scope } from "@/lib/types"
import { usePortal } from "@/store/portal-store"

/**
 * Contexto activo (Product Spec §8 y Benchmark: patrón multi-entidad de Brex).
 * Barra compacta arriba de cada página: empresa que se está viendo y su RFC.
 */
export function ContextBar() {
  const { state, allowed, setScope } = usePortal()
  const options = companies.filter((c) => allowed.includes(c.id))
  const canGroup = options.length > 1
  const current = state.scope === "grupo" ? null : companies.find((c) => c.id === state.scope)

  function choose(next: Scope) {
    setScope(next)
    toast(next === "grupo" ? `Viendo ${group.name}` : `Viendo ${companies.find((c) => c.id === next)!.name}`, {
      description: "Cifras, pendientes y documentos se ajustaron al nuevo contexto.",
      duration: 2500,
    })
  }

  return (
    <section aria-label="Contexto" className="mb-4 flex items-center gap-3 rounded-lg border bg-card px-3 py-1.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {current ? <Building2 className="size-4" /> : <Layers className="size-4" />}
      </span>
      <Select value={state.scope} onValueChange={(v) => choose(v as Scope)} disabled={!canGroup}>
        <SelectTrigger aria-label="Empresa" className="h-8 min-w-0 border-0 bg-transparent px-1.5 text-sm font-semibold shadow-none hover:bg-accent data-[size=default]:h-8 sm:w-auto">
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
      <span className="ml-auto hidden truncate pr-2 text-xs text-muted-foreground tabular-nums sm:block">{current ? `${current.legalName} · RFC ${current.rfc}` : `${options.length} razones sociales`}</span>
    </section>
  )
}
