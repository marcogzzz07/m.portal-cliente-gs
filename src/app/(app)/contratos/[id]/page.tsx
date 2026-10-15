import type { Metadata } from "next"

import { ContractDetail } from "@/components/features/contratos/contract-detail"

export const metadata: Metadata = { title: "Propuestas y contratos" }

export default async function ContratoPage({ params }: PageProps<"/contratos/[id]">) {
  const { id } = await params
  return <ContractDetail id={id} />
}
