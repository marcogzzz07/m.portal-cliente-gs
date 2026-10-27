import { FileArchive, FileCode2, FileSpreadsheet, FileText, Presentation } from "lucide-react"

import { StatusBadge } from "@/components/shared/status-badge"
import { docStatus } from "@/lib/status"
import type { DocumentItem, FileFormat } from "@/lib/types"
import { cn } from "@/lib/utils"

export const formatMeta: Record<FileFormat, { label: string; icon: typeof FileText; className: string }> = {
  pdf: { label: "PDF", icon: FileText, className: "bg-muted text-[var(--gs-color-text-secondary)]" },
  xlsx: { label: "Excel", icon: FileSpreadsheet, className: "bg-muted text-[var(--gs-color-text-secondary)]" },
  pptx: { label: "PowerPoint", icon: Presentation, className: "bg-muted text-[var(--gs-color-text-secondary)]" },
  xml: { label: "XML", icon: FileCode2, className: "bg-muted text-[var(--gs-color-text-secondary)]" },
  zip: { label: "ZIP", icon: FileArchive, className: "bg-muted text-[var(--gs-color-text-secondary)]" },
  docx: { label: "Word", icon: FileText, className: "bg-muted text-[var(--gs-color-text-secondary)]" },
}

export function DocIcon({ doc, className }: { doc: DocumentItem; className?: string }) {
  const meta = formatMeta[doc.formats[0]]
  const Icon = meta.icon
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", meta.className, className)}>
      <Icon className="size-4" />
    </span>
  )
}

/** Estado legible del documento. Los firmados y archivados se muestran como tales. */
export function DocStatusBadge({ doc }: { doc: DocumentItem }) {
  if (doc.signed) return <StatusBadge label="Firmado" tone="success" />
  if (doc.archived) return <StatusBadge label="Archivado" tone="neutral" />
  return <StatusBadge {...docStatus[doc.status]} />
}

export type DocView = "pendientes" | "enviados" | "recibidos" | "facturas" | "firmados" | "archivo"

export function docView(doc: DocumentItem): DocView {
  if (doc.signed) return "firmados"
  if (doc.archived) return "archivo"
  if (doc.direction === "gs") return doc.service === "facturacion" ? "facturas" : "recibidos"
  if (doc.status === "requested" || doc.status === "changes_required" || doc.status === "expired") return "pendientes"
  return "enviados"
}
