import type { Metadata } from "next"

import { DocumentsView } from "@/components/features/documentos/documents-view"

export const metadata: Metadata = { title: "Documentos" }

export default function DocumentosPage() {
  return <DocumentsView />
}
