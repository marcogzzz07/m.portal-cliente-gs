import type { ActionKind, ActionStatus, ContractStatus, DocStatus, EventType, InvoiceStatus, OnboardingStatus, PaymentStatus, Priority, ServiceHealth, UserStatus } from "./types"

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

/**
 * Tipos de evento en neutros (como los tipos de reunión del calendario del
 * Portal GS): el color queda reservado para estados. El nombre del tipo siempre
 * se muestra junto al evento y en la leyenda.
 */
const neutralEvent = { dot: "bg-muted-foreground", chip: "bg-muted text-foreground" }
export const eventTypeMeta: Record<EventType, { label: string; dot: string; chip: string }> = {
  fiscal: { label: "Fiscal", ...neutralEvent },
  contable: { label: "Contable", ...neutralEvent },
  contractual: { label: "Contractual", ...neutralEvent },
  proyecto: { label: "Proyecto", ...neutralEvent },
  reunion: { label: "Reunión", ...neutralEvent },
  pago: { label: "Pago", ...neutralEvent },
  renovacion: { label: "Renovación", ...neutralEvent },
}

export const contractStatus: Record<ContractStatus, StatusMeta> = {
  draft: { label: "En preparación", tone: "neutral" },
  sent: { label: "Por revisar", tone: "warning" },
  viewed: { label: "En revisión", tone: "info" },
  changes_requested: { label: "Cambios solicitados", tone: "warning" },
  partially_signed: { label: "Firma parcial", tone: "info" },
  completed: { label: "Firmado", tone: "success" },
  declined: { label: "Rechazado", tone: "danger" },
  expired: { label: "Vencido", tone: "neutral" },
  voided: { label: "Anulado", tone: "neutral" },
}

export const invoiceStatus: Record<InvoiceStatus, StatusMeta> = {
  issued: { label: "Por pagar", tone: "neutral" },
  due_soon: { label: "Vence pronto", tone: "warning" },
  overdue: { label: "Vencida", tone: "danger" },
  disputed: { label: "En aclaración", tone: "info" },
  partially_paid: { label: "Pago parcial", tone: "info" },
  paid: { label: "Pagada", tone: "success" },
  voided: { label: "Cancelada", tone: "neutral" },
}

export const paymentStatus: Record<PaymentStatus, StatusMeta> = {
  initiated: { label: "Iniciado", tone: "neutral" },
  processing: { label: "Procesando", tone: "info" },
  pending_validation: { label: "Por validar", tone: "warning" },
  applied: { label: "Aplicado", tone: "success" },
  failed: { label: "Rechazado", tone: "danger" },
  refunded: { label: "Reembolsado", tone: "neutral" },
}

export const userStatus: Record<UserStatus, StatusMeta> = {
  activo: { label: "Activo", tone: "success" },
  invitado: { label: "Invitación enviada", tone: "info" },
  suspendido: { label: "Suspendido", tone: "warning" },
  revocado: { label: "Revocado", tone: "neutral" },
  expirado: { label: "Invitación vencida", tone: "neutral" },
}

export const onboardingStatus: Record<OnboardingStatus, StatusMeta> = {
  locked: { label: "Bloqueado", tone: "neutral" },
  available: { label: "Disponible", tone: "warning" },
  in_progress: { label: "En curso", tone: "info" },
  submitted: { label: "Enviado", tone: "info" },
  under_review: { label: "En revisión GS", tone: "info" },
  changes_required: { label: "Requiere corrección", tone: "danger" },
  approved: { label: "Aprobado", tone: "success" },
  completed: { label: "Completado", tone: "success" },
}
