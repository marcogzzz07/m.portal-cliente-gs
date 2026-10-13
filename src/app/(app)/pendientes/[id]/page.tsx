import type { Metadata } from "next"

import { PendientesView } from "@/components/features/pendientes/pendientes-view"

export const metadata: Metadata = { title: "Pendientes" }

/** Acceso profundo desde una notificación o correo al pendiente específico. */
export default async function PendienteDetailPage({ params }: PageProps<"/pendientes/[id]">) {
  const { id } = await params
  return <PendientesView initialId={id} />
}
