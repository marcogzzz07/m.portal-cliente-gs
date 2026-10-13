import type { ActionKind, ActionStatus, DocStatus, EventType, Priority, ServiceHealth } from "./types"

/** Tonos de las etiquetas de estado (StatusBadge). Siempre acompañados de una palabra, nunca solo color. */
export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "brand"

export interface StatusMeta {
  label: string
  tone: StatusTone
}

export const actionStatus: Record<ActionStatus, StatusMeta> = {
  upcoming: { label: "Próximo", tone: "neutral" },
  open: { label: "Por atender", tone: "warning" },
  submitted: { label: "Enviado", tone: "info" },
  under_review: { label: "En revisión GS", tone: "info" },
  changes_required: { label: "Requiere corrección", tone: "danger" },
  completed: { label: "Completado", tone: "success" },
  overdue: { label: "Vencido", tone: "danger" },
  blocked: { label: "Bloqueado", tone: "neutral" },
}

export const docStatus: Record<DocStatus, StatusMeta> = {
  requested: { label: "Solicitado", tone: "warning" },
  uploaded: { label: "Recibido", tone: "info" },
  under_review: { label: "En revisión", tone: "info" },
  changes_required: { label: "Requiere corrección", tone: "danger" },
  approved: { label: "Aprobado", tone: "success" },
  completed: { label: "Publicado", tone: "success" },
  expired: { label: "Solicitud vencida", tone: "neutral" },
}

export const priorityMeta: Record<Priority, StatusMeta> = {
  alta: { label: "Prioridad alta", tone: "danger" },
  media: { label: "Prioridad media", tone: "warning" },
  baja: { label: "Prioridad baja", tone: "neutral" },
}

export const healthMeta: Record<ServiceHealth, StatusMeta> = {
  al_corriente: { label: "Al corriente", tone: "success" },
  en_curso: { label: "En curso", tone: "info" },
  requiere_atencion: { label: "Requiere tu atención", tone: "warning" },
  atrasado: { label: "Con retraso", tone: "danger" },
}

export const actionKindMeta: Record<ActionKind, { label: string; verb: string }> = {
  subir: { label: "Carga de documento", verb: "Subir documento" },
  aprobar: { label: "Aprobación", verb: "Revisar y aprobar" },
  firmar: { label: "Firma", verb: "Firmar" },
  pagar: { label: "Pago", verb: "Pagar" },
  responder: { label: "Respuesta", verb: "Responder" },
  confirmar: { label: "Confirmación", verb: "Confirmar" },
}

/** Colores por tipo de evento. La leyenda siempre muestra el nombre del tipo. */
export const eventTypeMeta: Record<EventType, { label: string; dot: string; chip: string }> = {
  fiscal: { label: "Fiscal", dot: "bg-brand", chip: "bg-brand-soft text-brand" },
  contable: { label: "Contable", dot: "bg-info", chip: "bg-info/12 text-info" },
  contractual: { label: "Contractual", dot: "bg-violet-600", chip: "bg-violet-100 text-violet-700" },
  proyecto: { label: "Proyecto", dot: "bg-amber-500", chip: "bg-amber-100 text-amber-800" },
  reunion: { label: "Reunión", dot: "bg-success", chip: "bg-success/12 text-success" },
  pago: { label: "Pago", dot: "bg-[oklch(0.4_0.006_264)]", chip: "bg-muted text-foreground" },
  renovacion: { label: "Renovación", dot: "bg-orange-500", chip: "bg-orange-100 text-orange-800" },
}
