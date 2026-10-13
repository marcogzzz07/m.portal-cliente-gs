import type { Metadata } from "next"

import { DocumentDetail } from "@/components/features/documentos/document-detail"

export const metadata: Metadata = { title: "Documento" }

export default async function DocumentoPage({ params }: PageProps<"/documentos/[id]">) {
  const { id } = await params
  return <DocumentDetail id={id} />
}
