import { FileArchive, FileCode2, FileSpreadsheet, FileText, Presentation } from "lucide-react"

import { StatusBadge } from "@/components/shared/status-badge"
import { docStatus } from "@/lib/status"
import type { DocumentItem, FileFormat } from "@/lib/types"
import { cn } from "@/lib/utils"

export const formatMeta: Record<FileFormat, { label: string; icon: typeof FileText; className: string }> = {
  pdf: { label: "PDF", icon: FileText, className: "bg-rose-50 text-rose-700" },
  xlsx: { label: "Excel", icon: FileSpreadsheet, className: "bg-emerald-50 text-emerald-700" },
  pptx: { label: "PowerPoint", icon: Presentation, className: "bg-orange-50 text-orange-700" },
  xml: { label: "XML", icon: FileCode2, className: "bg-sky-50 text-sky-700" },
  zip: { label: "ZIP", icon: FileArchive, className: "bg-slate-100 text-slate-700" },
  docx: { label: "Word", icon: FileText, className: "bg-blue-50 text-blue-700" },
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

export type DocView = "pendientes" | "enviados" | "recibidos" | "firmados" | "archivo"

export function docView(doc: DocumentItem): DocView {
  if (doc.signed) return "firmados"
  if (doc.archived) return "archivo"
  if (doc.direction === "gs") return "recibidos"
  if (doc.status === "requested" || doc.status === "changes_required" || doc.status === "expired") return "pendientes"
  return "enviados"
}
