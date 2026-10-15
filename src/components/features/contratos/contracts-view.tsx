"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, FileClock, FileSignature, FileText, PenLine } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs } from "@/components/ui/tabs"
import { AccessDenied } from "@/components/shared/access-denied"
import { EmptyState } from "@/components/shared/empty-state"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { PageTabsList, PageTabsTrigger } from "@/components/shared/page-tabs"
import { StatusBadge } from "@/components/shared/status-badge"
import { useScopedData } from "@/hooks/use-scoped-data"
import { daysFromToday, formatDate } from "@/lib/format"
import { canAccessModule } from "@/lib/permissions"
import { contractStatus } from "@/lib/status"
import type { Contract } from "@/lib/types"
import { useAdmin } from "@/store/admin-store"
import { usePortal } from "@/store/portal-store"

type View = "pendientes" | "firmados" | "historial"

const inView: Record<View, (c: Contract) => boolean> = {
  pendientes: (c) => ["draft", "sent", "viewed", "changes_requested", "partially_signed"].includes(c.status),
  firmados: (c) => c.status === "completed",
  historial: (c) => ["declined", "expired", "voided"].includes(c.status),
}

/** Propuestas y contratos (Product Spec §13): revisión, aprobación, firma y archivo de lo firmado. */
export function ContractsView() {
  const router = useRouter()
  const { persona } = usePortal()
  const { state } = useAdmin()
  const { scopeBadge } = useScopedData()
  const [view, setView] = useState<View>("pendientes")

  if (!canAccessModule(persona, "contratos")) return <AccessDenied />

  const list = state.contracts.filter(inView[view])
  const toSign = state.contracts.filter((c) => c.signers.some((s) => s.personId === persona.personId && s.status === "pendiente") && ["sent", "viewed", "partially_signed"].includes(c.status))
  const signed = state.contracts.filter((c) => c.status === "completed").length
  const open = state.contracts.filter(inView.pendientes)
  const nextExpiry = open.filter((c) => c.validUntil).sort((a, b) => a.validUntil!.localeCompare(b.validUntil!))[0]

  return (
    <div className="space-y-6">
      <PageHeader icon={FileSignature} title="Propuestas y contratos" badge={scopeBadge} description="Revisa el alcance y los honorarios, pide aclaraciones o cambios y firma electrónicamente sin salir del portal." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard label="Por atender" value={open.length} icon={FileClock} accent="amber" helper="Propuestas y documentos abiertos" />
        <MetricCard label="Esperan tu firma" value={toSign.length} icon={PenLine} accent="pink" helper={toSign.length ? toSign[0].title : "Nada por firmar"} />
        <MetricCard label="Firmados" value={signed} icon={FileSignature} accent="green" helper="Con certificado de firma" />
        <MetricCard label="Próximo vencimiento" value={nextExpiry ? formatDate(nextExpiry.validUntil!) : "—"} icon={FileText} accent="blue" helper={nextExpiry ? `Faltan ${daysFromToday(nextExpiry.validUntil!)} días` : "Sin propuestas abiertas"} />
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)} className="gap-5">
        <PageTabsList>
          <PageTabsTrigger value="pendientes">
            Por atender <span className="ml-2 text-muted-foreground tabular-nums">{open.length}</span>
          </PageTabsTrigger>
          <PageTabsTrigger value="firmados">
            Firmados <span className="ml-2 text-muted-foreground tabular-nums">{signed}</span>
          </PageTabsTrigger>
          <PageTabsTrigger value="historial">
            Vencidos y rechazados <span className="ml-2 text-muted-foreground tabular-nums">{state.contracts.filter(inView.historial).length}</span>
          </PageTabsTrigger>
        </PageTabsList>

        {list.length === 0 ? (
          <EmptyState icon={FileSignature} title="Nada por aquí" description="No hay documentos en esta vista." />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.06]">
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Documento</TableHead>
                  <TableHead>Empresas</TableHead>
                  <TableHead>{view === "firmados" ? "Firmado" : "Enviado"}</TableHead>
                  <TableHead>Firmas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-0" aria-label="Abrir" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((c) => {
                  const done = c.signers.filter((s) => s.status === "firmado").length
                  const lastSigned = c.signers.map((s) => s.signedAt).filter(Boolean).sort().at(-1)
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/contratos/${c.id}`)}>
                      <TableCell className="w-[40%] max-w-0">
                        <p className="truncate font-medium">{c.title}</p>
                        <p className="truncate text-[13px] text-muted-foreground">
                          {c.kind} · versión {c.version}
                          {c.validUntil && view === "pendientes" ? ` · válida hasta el ${formatDate(c.validUntil)}` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.companies.length > 1 ? `${c.companies.length} empresas` : c.companies[0]}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{view === "firmados" && lastSigned ? formatDate(lastSigned.slice(0, 10)) : c.sentAt ? formatDate(c.sentAt.slice(0, 10)) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {done} de {c.signers.length}
                      </TableCell>
                      <TableCell>
                        <StatusBadge {...contractStatus[c.status]} />
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <ul className="divide-y md:hidden">
              {list.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => router.push(`/contratos/${c.id}`)} className="flex w-full items-start gap-3 px-5 py-4 text-left">
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <span className="block font-medium leading-snug">{c.title}</span>
                      <span className="block text-[13px] text-muted-foreground">
                        {c.kind} · {c.signers.filter((s) => s.status === "firmado").length} de {c.signers.length} firmas
                      </span>
                      <StatusBadge {...contractStatus[c.status]} />
                    </span>
                    <ChevronRight className="mt-1 size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Tabs>
    </div>
  )
}
