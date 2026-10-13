"use client"

import { Building2, Check, ChevronDown, Layers } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { companies, group } from "@/data/organization"
import type { Scope } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"

/**
 * Selector de contexto persistente (Benchmark: Brex multi-entidad).
 * Dos niveles: grupo completo o una razón social. Siempre visible en el encabezado.
 */
export function ContextSwitcher() {
  const { state, allowed, setScope } = usePortal()
  const scope = state.scope
  const isGroup = scope === "grupo"
  const current = isGroup ? null : companies.find((c) => c.id === scope)!
  const canGroup = allowed.length > 1
  const options = companies.filter((c) => allowed.includes(c.id))

  function choose(next: Scope) {
    if (next === scope) return
    setScope(next)
    toast(next === "grupo" ? `Viendo: ${group.name}` : `Viendo: ${companies.find((c) => c.id === next)!.name}`, {
      description: "Cifras, pendientes y documentos se actualizaron al nuevo contexto.",
      duration: 2500,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={!canGroup}
        className={cn(
          "group flex h-11 min-w-0 shrink items-center gap-2.5 sm:min-w-60 sm:shrink-0 rounded-xl border bg-card px-2.5 text-left shadow-xs transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default disabled:hover:bg-card sm:px-3",
          !isGroup && "border-brand/30"
        )}
        aria-label={`Contexto activo: ${isGroup ? group.name : current!.name}. Cambiar contexto`}
      >
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", isGroup ? "bg-primary text-primary-foreground" : "bg-brand-soft text-brand")}>
          {isGroup ? <Layers className="size-4" /> : <Building2 className="size-4" />}
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{isGroup ? "Grupo completo" : "Razón social"}</span>
          <span className="truncate text-sm font-semibold">
            {isGroup ? (
              <>
                <span className="sm:hidden">{group.shortName}</span>
                <span className="hidden sm:inline">{group.name}</span>
              </>
            ) : (
              current!.name
            )}
          </span>
        </span>
        {canGroup && <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Ver información de…</DropdownMenuLabel>
        {canGroup && (
          <>
            <DropdownMenuItem onSelect={() => choose("grupo")} className="items-start gap-3 py-2">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Layers className="size-4" />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-medium">Grupo completo</span>
                <span className="text-xs text-muted-foreground">
                  {group.name} · {options.length} razones sociales
                </span>
              </span>
              {isGroup && <Check className="mt-1" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Razones sociales</DropdownMenuLabel>
        {options.map((c) => (
          <DropdownMenuItem key={c.id} onSelect={() => choose(c.id)} className="items-start gap-3 py-2">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Building2 className="size-4" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                RFC {c.rfc} · {c.city}
              </span>
            </span>
            {scope === c.id && <Check className="mt-1" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
