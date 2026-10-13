"use client"

import { AlertTriangle } from "lucide-react"

import { integrations } from "@/data/organization"
import { formatDateTime } from "@/lib/format"
import { usePortal } from "@/store/portal-store"

/** Aviso cuando una integración no responde: se usa la última sincronización válida (Product Spec §23). */
export function IntegrationBanner() {
  const { state } = usePortal()
  if (!state.demo.contalinkDown) return null
  const contalink = integrations.find((i) => i.key === "contalink")!
  return (
    <div role="status" className="mx-4 mt-2 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm sm:mx-6 lg:mx-8">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklch,var(--warning),black_35%)]" />
      <p>
        <span className="font-semibold">ContaLink no responde.</span> Las cifras contables muestran la última sincronización válida ({formatDateTime(contalink.fallbackSync)}). Puedes seguir consultando y
        cargando documentos; GS ya fue notificado.
      </p>
    </div>
  )
}
