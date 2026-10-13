"use client"

import { useRef, useState } from "react"
import { FileUp, Paperclip, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { companies, serviceNames } from "@/data/organization"
import type { CompanyId, DocumentItem, ServiceKey } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"

function formatSize(bytes: number) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Documento existente: la carga crea una nueva versión. Sin documento: carga libre con metadatos. */
  doc?: DocumentItem
  onDone?: (docId: string) => void
}

/**
 * Carga de archivo simulada. El archivo no sale del navegador: solo se registran nombre y tamaño.
 * Reemplazar crea una nueva versión y nunca borra el historial (Product Spec §12).
 */
export function UploadDialog({ open, onOpenChange, doc, onDone }: UploadDialogProps) {
  const { uploadVersion, createDocument, allowed, state } = usePortal()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<{ name: string; size: string } | null>(null)
  const [note, setNote] = useState("")
  const [dragging, setDragging] = useState(false)
  const defaultCompany = state.scope === "grupo" ? allowed[0] : state.scope
  const [meta, setMeta] = useState<{ company: CompanyId; service: ServiceKey; period: string; docType: string; name: string }>({
    company: defaultCompany,
    service: "contabilidad",
    period: "Octubre 2026",
    docType: "Soporte contable",
    name: "",
  })

  const isNewVersion = Boolean(doc && doc.versions.length > 0)
  const nextVersion = (doc?.versions.length ?? 0) + 1

  function pick(f: File | undefined) {
    if (!f) return
    setFile({ name: f.name, size: formatSize(f.size) })
  }

  function reset() {
    setFile(null)
    setNote("")
    setDragging(false)
  }

  function submit() {
    if (!file) return
    if (doc) {
      uploadVersion(doc.id, file, note || undefined)
      toast.success(isNewVersion ? `Versión ${nextVersion} cargada` : "Documento cargado", {
        description: "Quedó como “Recibido”. Cargado no significa aprobado: GS lo revisará y te avisará.",
      })
      onDone?.(doc.id)
    } else {
      const id = createDocument(
        {
          name: meta.name || file.name.replace(/\.[^.]+$/, ""),
          companies: [meta.company],
          service: meta.service,
          period: meta.period,
          docType: meta.docType,
          direction: "cliente",
          formats: [(file.name.split(".").pop()?.toLowerCase() as DocumentItem["formats"][number]) ?? "pdf"],
          visibility: "grupo",
        },
        file,
        note || undefined
      )
      toast.success("Documento enviado a GS", { description: "Lo encontrarás en Enviados con estado “Recibido”." })
      onDone?.(id)
    }
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{doc ? (isNewVersion ? `Subir versión ${nextVersion}` : "Subir documento") : "Enviar un documento a GS"}</DialogTitle>
          <DialogDescription>
            {doc ? (
              <>
                {doc.name} · {doc.period}
                {isNewVersion && " · La versión anterior se conserva en el historial."}
              </>
            ) : (
              "Indica a qué empresa, servicio y periodo corresponde para que llegue a la persona correcta."
            )}
          </DialogDescription>
        </DialogHeader>

        {doc?.instructions && <p className="rounded-lg bg-muted/70 px-3 py-2 text-sm">{doc.instructions}</p>}

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            pick(e.dataTransfer.files[0])
          }}
          className={cn("flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors", dragging ? "border-brand bg-brand-soft/40" : "border-border")}
        >
          {file ? (
            <div className="flex w-full items-center gap-3 rounded-lg bg-muted/60 px-3 py-2 text-left">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">{file.size}</span>
              </span>
              <Button variant="ghost" size="icon-sm" onClick={() => setFile(null)} aria-label="Quitar archivo">
                <X />
              </Button>
            </div>
          ) : (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <FileUp className="size-5" />
              </span>
              <p className="text-sm">
                Arrastra el archivo aquí o{" "}
                <button type="button" className="font-semibold text-brand underline-offset-2 hover:underline" onClick={() => inputRef.current?.click()}>
                  elígelo en tu equipo
                </button>
              </p>
              <p className="text-xs text-muted-foreground">PDF, Excel, XML o ZIP. En el prototipo el archivo no se envía a ningún servidor.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => setFile({ name: doc ? `${doc.name.replace(/[^\wáéíóúñ]+/gi, "_").replace(/^_+|_+$/g, "")}_v${nextVersion}.${doc.formats[0]}` : "documento_ejemplo.pdf", size: "3.2 MB" })}
              >
                Usar un archivo de ejemplo
              </Button>
            </>
          )}
          <input ref={inputRef} type="file" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} aria-label="Elegir archivo" />
        </div>

        {!doc && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="doc-name">Nombre del documento</Label>
              <Input id="doc-name" placeholder="Ej. Contrato de compraventa de montacargas" value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Empresa</Label>
              <Select value={meta.company} onValueChange={(v) => setMeta({ ...meta, company: v as CompanyId })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies
                    .filter((c) => allowed.includes(c.id))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Servicio</Label>
              <Select value={meta.service} onValueChange={(v) => setMeta({ ...meta, service: v as ServiceKey })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["contabilidad", "impuestos", "auditoria", "legal"] as ServiceKey[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {serviceNames[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Periodo</Label>
              <Select value={meta.period} onValueChange={(v) => setMeta({ ...meta, period: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Octubre 2026", "Septiembre 2026", "Agosto 2026", "Ejercicio 2026"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select value={meta.docType} onValueChange={(v) => setMeta({ ...meta, docType: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Soporte contable", "Estado de cuenta", "Contrato", "CFDI", "Evidencia de auditoría", "Otro"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="upload-note">Nota para GS (opcional)</Label>
          <Textarea id="upload-note" rows={2} placeholder={isNewVersion ? "Ej. Se agregan los 3 XML faltantes." : "Contexto que ayude a revisar el archivo."} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!file}>
            <FileUp />
            {isNewVersion ? `Subir versión ${nextVersion}` : "Subir documento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
