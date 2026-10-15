"use client"

import Link from "next/link"
import { Download, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { serviceNames } from "@/data/organization"
import { downloadDocument } from "@/lib/file-export"
import { companiesLabel } from "@/lib/labels"
import type { DocumentItem, FileFormat } from "@/lib/types"
import { usePortal } from "@/store/portal-store"
import { formatMeta } from "./doc-meta"
import { DocumentPaper } from "./document-paper"

/** Descarga real del documento ficticio y registro de la descarga (usuario, versión, formato y fecha). */
export function useDocumentDownload() {
  const { logDownload } = usePortal()
  return (doc: DocumentItem, format: FileFormat) => {
    downloadDocument(doc, format)
    logDownload(doc.id, format)
    toast.success(`Descargando ${formatMeta[format].label}`, {
      description: format === "xlsx" ? "Se entrega como CSV, que Excel abre directamente." : "La descarga quedó registrada.",
    })
  }
}

export function DocPreviewDialog({ doc, onClose }: { doc: DocumentItem | null; onClose: () => void }) {
  const download = useDocumentDownload()
  if (!doc) return null
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4 pr-12">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base">
              {doc.name} · {doc.period}
            </DialogTitle>
            <DialogDescription className="truncate">
              {companiesLabel(doc.companies)} · {serviceNames[doc.service]}
            </DialogDescription>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/60 p-4 sm:p-8">
          <DocumentPaper doc={doc} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/documentos/${doc.id}`} onClick={onClose}>
              <ExternalLink />
              Ver detalle y versiones
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            {doc.formats.map((f) => (
              <Button key={f} variant={f === doc.formats[0] ? "default" : "outline"} size="sm" onClick={() => download(doc, f)}>
                <Download />
                {formatMeta[f].label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
