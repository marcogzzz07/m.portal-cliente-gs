import Link from "next/link"
import { Briefcase, FileSignature, FileText, Lightbulb, ListChecks, MessageCircle, Receipt } from "lucide-react"

import type { Conversation, ContextType } from "@/lib/types"
import { cn } from "@/lib/utils"

export const contextMeta: Record<ContextType, { label: string; icon: typeof FileText }> = {
  documento: { label: "Documento", icon: FileText },
  pendiente: { label: "Pendiente", icon: ListChecks },
  factura: { label: "Factura", icon: Receipt },
  insight: { label: "Insight", icon: Lightbulb },
  contrato: { label: "Contrato", icon: FileSignature },
  proyecto: { label: "Proyecto", icon: Briefcase },
  servicio: { label: "Servicio", icon: Briefcase },
  general: { label: "General", icon: MessageCircle },
}

export function contextHref(ctx: Conversation["context"]) {
  switch (ctx.type) {
    case "documento":
      return `/documentos/${ctx.refId}`
    case "pendiente":
      return `/pendientes/${ctx.refId}`
    case "factura":
      return "/facturacion"
    case "contrato":
      return "/contratos"
    case "proyecto":
    case "servicio":
      return "/servicios"
    case "insight":
      return "/"
    default:
      return null
  }
}

/** Contexto al que pertenece una conversación (documento, pendiente, factura…). */
export function ContextChip({ context, link = false, className }: { context: Conversation["context"]; link?: boolean; className?: string }) {
  const meta = contextMeta[context.type]
  const Icon = meta.icon
  const href = contextHref(context)
  const body = (
    <>
      <Icon className="size-3 shrink-0" />
      <span className="font-semibold">{meta.label}:</span>
      <span className="truncate">{context.label}</span>
    </>
  )
  const cls = cn("inline-flex max-w-full min-w-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground", className)
  return link && href ? (
    <Link href={href} className={cn(cls, "hover:bg-accent hover:text-foreground")}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  )
}
