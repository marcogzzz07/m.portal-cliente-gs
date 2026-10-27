"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2, FileText, ListChecks, MessagesSquare, Search, SearchX } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { navItems } from "@/config/navigation"
import { site } from "@/config/site"
import { companies } from "@/data/organization"
import { canAccessModule, canSeeAction, canSeeConversation, canSeeDocument } from "@/lib/permissions"
import { companiesLabel } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

interface Result {
  key: string
  group: string
  title: string
  subtitle: string
  icon: LucideIcon
  run: () => void
}

/** Buscador global (⌘K): secciones, pendientes, documentos, conversaciones y empresas, respetando permisos. */
export function GlobalSearch({ className, compact = false }: { className?: string; compact?: boolean }) {
  const router = useRouter()
  const { state, persona, setScope } = usePortal()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (compact) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [compact])

  const index = useMemo<Result[]>(() => {
    const go = (href: string) => () => router.push(href)
    return [
      ...navItems
        .filter((i) => canAccessModule(persona, i.module))
        .map((i) => ({ key: i.href, group: "Secciones", title: i.title, subtitle: i.description, icon: i.icon, run: go(i.href) })),
      ...state.actionItems
        .filter((a) => canSeeAction(persona, a))
        .map((a) => ({ key: a.id, group: "Pendientes", title: a.title, subtitle: companiesLabel(a.companies), icon: ListChecks, run: go(`/pendientes/${a.id}`) })),
      ...state.documents
        .filter((d) => canSeeDocument(persona, d))
        .map((d) => ({ key: d.id, group: "Documentos", title: `${d.name} · ${d.period}`, subtitle: companiesLabel(d.companies), icon: FileText, run: go(`/documentos/${d.id}`) })),
      ...state.conversations
        .filter((c) => canSeeConversation(persona, c))
        .map((c) => ({ key: c.id, group: "Conversaciones", title: c.subject, subtitle: c.context.label, icon: MessagesSquare, run: go(`/mensajes/${c.id}`) })),
      ...companies
        .filter((c) => persona.companies.includes(c.id))
        .map((c) => ({ key: c.id, group: "Empresas", title: c.name, subtitle: `RFC ${c.rfc} · cambiar el contexto a esta empresa`, icon: Building2, run: () => setScope(c.id) })),
    ]
  }, [state, persona, router, setScope])

  const q = normalize(query.trim())
  const results = q ? index.filter((r) => normalize(`${r.title} ${r.subtitle}`).includes(q)).slice(0, 12) : index.filter((r) => r.group === "Secciones").slice(0, 6)
  const groups = [...new Set(results.map((r) => r.group))]

  function close() {
    setOpen(false)
    setQuery("")
  }

  return (
    <>
      {compact ? (
        <Button variant="ghost" size="icon-lg" className={cn("rounded-full", className)} onClick={() => setOpen(true)} aria-label="Buscar">
          <Search className="size-[18px]" />
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-9 w-full items-center gap-2.5 rounded-full border bg-muted px-3.5 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            className
          )}
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 truncate text-left">Buscar documentos, pendientes…</span>
          <kbd className="hidden rounded-md border bg-background px-1.5 py-0.5 font-sans text-[11px] font-medium lg:inline">⌘K</kbd>
        </button>
      )}

      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : close())}>
        <DialogContent className="top-[10%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Buscar en {site.name}</DialogTitle>
          <DialogDescription className="sr-only">Busca secciones, pendientes, documentos, conversaciones y empresas.</DialogDescription>
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) {
                  results[0].run()
                  close()
                }
              }}
              placeholder="Ej. estados de cuenta, e.firma, Comercial…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground">Esc</kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {groups.map((g) => (
              <div key={g} className="mb-2">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{q ? g : "Accesos rápidos"}</p>
                <div className="space-y-0.5">
                  {results
                    .filter((r) => r.group === g)
                    .map((r) => {
                      const Icon = r.icon
                      return (
                        <button
                          key={`${r.group}-${r.key}`}
                          type="button"
                          onClick={() => {
                            r.run()
                            close()
                          }}
                          className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                            <Icon className="size-4" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium">{r.title}</span>
                            <span className="truncate text-xs text-muted-foreground">{r.subtitle}</span>
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
            {q && results.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <SearchX className="size-6" />
                No encontramos resultados para “{query}”.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
