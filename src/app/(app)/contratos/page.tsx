import type { Metadata } from "next"

import { ContractsView } from "@/components/features/contratos/contracts-view"

export const metadata: Metadata = { title: "Propuestas y contratos" }

export default function ContratosPage() {
  return <ContractsView />
}
