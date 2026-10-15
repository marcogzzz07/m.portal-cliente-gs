import type { Metadata } from "next"

import { InvoiceDetail } from "@/components/features/facturacion/invoice-detail"

export const metadata: Metadata = { title: "Factura" }

export default async function FacturaPage({ params }: PageProps<"/facturacion/[id]">) {
  const { id } = await params
  return <InvoiceDetail id={decodeURIComponent(id)} />
}
