import type { Metadata } from "next"

import { BillingView } from "@/components/features/facturacion/billing-view"

export const metadata: Metadata = { title: "Facturación y pagos" }

export default function FacturacionPage() {
  return <BillingView />
}
