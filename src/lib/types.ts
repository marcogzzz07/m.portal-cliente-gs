/**
 * Modelo de información del Portal de Clientes (Product Spec §7).
 * Todos los datos del prototipo son ficticios.
 */

export type CompanyId = "manufactura" | "comercial" | "logistica" | "inmuebles" | "servicios"
/** Contexto activo: grupo completo o una razón social. */
export type Scope = "grupo" | CompanyId

export interface Company {
  id: CompanyId
  name: string
  legalName: string
  rfc: string
  activity: string
  city: string
}

export type ServiceKey = "contabilidad" | "impuestos" | "auditoria" | "legal" | "facturacion"

export type ServiceHealth = "al_corriente" | "requiere_atencion" | "en_curso" | "atrasado"

export interface Service {
  id: string
  key: ServiceKey
  name: string
  kind: "recurrente" | "proyecto"
  companies: CompanyId[]
  period: string
  leadId: string
  summary: string
  /** Estado visible por empresa. */
  health: Partial<Record<CompanyId, ServiceHealth>>
  nextMilestone: { title: string; date: string }
  /** Fase del prototipo en que se construye su página de detalle. */
  detailPhase: 2 | 3
}

export type RoleKey = "admin" | "ejecutivo" | "operativo" | "firmante" | "pagos" | "consulta"

export interface Person {
  id: string
  firstName: string
  lastName: string
  /** Puesto o cargo. */
  title: string
  org: "gs" | "cliente"
  email: string
  phone?: string
}

export interface Persona {
  personId: string
  role: RoleKey
  companies: CompanyId[]
  /** Descripción corta del escenario para el panel de demo. */
  scenario: string
}

export interface GsMember {
  personId: string
  area: string
  materia: string
  services: ServiceKey[]
  companies: CompanyId[] | "all"
  primary?: boolean
  /** Ausencia temporal con sustituto. */
  away?: { from: string; to: string; substituteId: string; note: string }
}

export type ActionStatus =
  | "upcoming"
  | "open"
  | "submitted"
  | "under_review"
  | "changes_required"
  | "completed"
  | "overdue"
  | "blocked"

export type ActionKind = "subir" | "aprobar" | "firmar" | "pagar" | "responder" | "confirmar"

export type Priority = "alta" | "media" | "baja"

export interface HistoryEntry {
  at: string
  text: string
  by?: string
}

export interface ActionItem {
  id: string
  title: string
  description: string
  kind: ActionKind
  companies: CompanyId[]
  service: ServiceKey
  dueDate: string
  /** Fecha en que se abre (para "upcoming"). */
  opensOn?: string
  priority: Priority
  status: ActionStatus
  /** De quién es el siguiente movimiento. */
  owner: "cliente" | "gs"
  assigneeId?: string
  gsOwnerId: string
  requirements?: string[]
  reviewNote?: string
  blockedReason?: string
  documentId?: string
  conversationId?: string
  /** Enlace a un módulo de fase posterior (factura, propuesta, contrato). */
  relatedHref?: string
  /** Datos que acompañan una aprobación. */
  approvalSummary?: { label: string; value: number }[]
  history: HistoryEntry[]
  completedAt?: string
}

export type EventType = "fiscal" | "contable" | "contractual" | "proyecto" | "reunion" | "pago" | "renovacion"

export interface CalendarEvent {
  id: string
  title: string
  type: EventType
  date: string
  endDate?: string
  time?: string
  endTime?: string
  companies: CompanyId[]
  service?: ServiceKey
  description: string
  location?: string
  actionItemId?: string
  /** Eventos derivados de pendientes se marcan para no duplicarlos. */
  derived?: boolean
  /** Reunión agendada desde el portal. */
  meetingId?: string
  meetingStatus?: "solicitada" | "confirmada" | "cancelada"
}

export type DocStatus = "requested" | "uploaded" | "under_review" | "changes_required" | "approved" | "completed" | "expired"

export type FileFormat = "pdf" | "xlsx" | "pptx" | "xml" | "zip" | "docx"

/** Plantilla de vista previa del entregable (cómo se "imprime" el documento ficticio). */
export type DocTemplate =
  | "estados_financieros"
  | "balanza"
  | "contabilidad_electronica"
  | "declaracion"
  | "papel_trabajo"
  | "diot"
  | "opinion"
  | "factura"
  | "reporte_ejecutivo"
  | "dictamen"
  | "anual"
  | "generico"

export interface DocVersion {
  version: number
  fileName: string
  size: string
  uploadedBy: string
  uploadedAt: string
  note?: string
  /** Resultado de la revisión de esta versión. */
  review?: { status: "approved" | "changes_required"; by: string; at: string; note?: string }
}

export interface DocumentItem {
  id: string
  name: string
  companies: CompanyId[]
  service: ServiceKey
  period: string
  docType: string
  /** cliente = lo envía el cliente; gs = entregable de GS. */
  direction: "cliente" | "gs"
  status: DocStatus
  signed?: { at: string; by: string[]; provider: string }
  archived?: boolean
  formats: FileFormat[]
  versions: DocVersion[]
  requestedBy?: string
  requestedAt?: string
  dueDate?: string
  instructions?: string
  actionItemId?: string
  conversationId?: string
  publishedAt?: string
  validUntil?: string
  downloads: { personId: string; version: number; at: string; format: FileFormat }[]
  visibility: "grupo" | "restringido"
  /** "AAAA-MM" del periodo, para ordenar y agrupar el repositorio. */
  periodKey?: string
  template?: DocTemplate
  /** Folio e importe (facturas de GS y declaraciones). */
  folio?: string
  amount?: number
}

export type MeetingModality = "video" | "oficinas_gs" | "oficinas_cliente"

export interface Meeting {
  id: string
  topic: string
  notes?: string
  date: string
  time: string
  endTime: string
  modality: MeetingModality
  hostId: string
  gsAttendees: string[]
  clientAttendees: string[]
  companies: CompanyId[]
  service?: ServiceKey
  status: "solicitada" | "confirmada" | "cancelada"
  requestedBy: string
  requestedAt: string
}

export interface NewsItem {
  id: string
  title: string
  category: "Fiscal" | "Legal" | "Laboral" | "Contable" | "Comercio exterior"
  date: string
  readMinutes: number
  image: string
  imageAlt: string
  summary: string
  whyItMatters: string
  body: string[]
  action?: { label: string; kind: "conversar" | "agendar" | "pendiente" | "calendario" | "documentos"; ref?: string }
  authorId: string
  area: string
  companies: CompanyId[]
  services: ServiceKey[]
  impact: "alto" | "medio" | "informativo"
  validUntil?: string
}

export type ContextType = "documento" | "pendiente" | "factura" | "insight" | "contrato" | "proyecto" | "servicio" | "general"

export interface Message {
  id: string
  authorId: string
  at: string
  text: string
  attachments?: { name: string; size: string }[]
}

export interface Conversation {
  id: string
  subject: string
  context: { type: ContextType; refId?: string; label: string }
  companies: CompanyId[]
  service: ServiceKey
  participants: string[]
  gsOwnerId: string
  status: "abierta" | "resuelta"
  messages: Message[]
  /** Último mensaje leído por el usuario actual (índice). */
  readUpTo: number
}

export type NotificationKind =
  | "pendiente_nuevo"
  | "vencimiento"
  | "documento_revisado"
  | "entregable"
  | "firma"
  | "factura"
  | "mensaje"
  | "insight"
  | "seguridad"

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  description: string
  at: string
  read: boolean
  href: string
  companies: CompanyId[]
}

export interface Activity {
  id: string
  date: string
  kind: "hito" | "entregable" | "obligacion" | "revision"
  title: string
  detail: string
  companies: CompanyId[]
  service: ServiceKey
  byId: string
  href?: string
}

export interface InsightPreview {
  id: string
  title: string
  signal: string
  explanation: string
  impact: string
  recommendation: string
  companies: CompanyId[]
  service: ServiceKey
  source: string
  period: string
  approvedBy: string
  approvedAt: string
  preliminary?: boolean
  conversationId?: string
}

export interface CompanyMetrics {
  /** Ingresos acumulados ene–ago (cerrado). */
  revenueYtd: number
  /** Ingresos de septiembre (preliminar). */
  revenueSep: number
  revenueSepPrev: number
  grossMargin: number
  compliance: { onTime: number; total: number; late: string[] }
  deliverables: { published: number; expected: number }
  balance: { due: number; overdue: number }
}

export interface IntegrationSource {
  key: "contalink" | "odoo" | "auditbrain" | "bfiskur" | "docusign"
  name: string
  lastSync: string
  /** Última sincronización válida cuando la integración falla. */
  fallbackSync: string
}

/* ─── Fase 3 · Relación administrativa ──────────────────────────────────── */

export type ContractStatus = "draft" | "sent" | "viewed" | "changes_requested" | "partially_signed" | "completed" | "declined" | "expired" | "voided"

export interface Signer {
  personId: string
  /** Cargo con el que firma (p. ej. "Director General"). */
  capacity: string
  org: "cliente" | "gs"
  status: "pendiente" | "firmado" | "rechazado"
  signedAt?: string
}

export interface ProposalLine {
  company: string
  service: string
  scope: string
  periodicity: "Mensual" | "Anual" | "Proyecto"
  /** Honorario por periodo, sin IVA. */
  fee: number
}

export interface Contract {
  id: string
  kind: "Propuesta" | "Contrato" | "Carta compromiso" | "Acuerdo" | "Acta"
  title: string
  summary: string
  companies: string[]
  status: ContractStatus
  version: number
  sentAt?: string
  validUntil?: string
  ownerId: string
  signers: Signer[]
  approvals: { personId: string; at: string }[]
  lines?: ProposalLine[]
  exclusions?: string[]
  deliverables?: string[]
  conditions?: string[]
  startDate?: string
  endDate?: string
  /** Anticipo que se factura al completar la firma (sin IVA). */
  advance?: number
  documentId?: string
  conversationId?: string
  changeRequest?: { by: string; at: string; text: string }
  declineReason?: string
  history: HistoryEntry[]
}

export type InvoiceStatus = "issued" | "due_soon" | "overdue" | "disputed" | "partially_paid" | "paid" | "voided"
export type PaymentStatus = "initiated" | "processing" | "pending_validation" | "applied" | "failed" | "refunded"
export type PaymentMethod = "tarjeta" | "liga" | "transferencia"

export interface Payment {
  id: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  at: string
  by: string
  reference: string
  receipt?: string
  failureReason?: string
}

export interface Invoice {
  id: string
  folio: string
  documentId: string
  company: CompanyId
  concept: string
  period: string
  issuedAt: string
  dueDate: string
  total: number
  payments: Payment[]
  voided?: { at: string; reason: string; replacedBy?: string }
  dispute?: {
    reason: string
    comment: string
    openedAt: string
    openedBy: string
    ownerId: string
    expectedBy: string
    conversationId: string
    status: "abierta" | "resuelta"
  }
  creditNote?: { folio: string; amount: number }
}

export type UserStatus = "activo" | "invitado" | "suspendido" | "revocado" | "expirado"

export interface ClientUser {
  id: string
  personId?: string
  firstName: string
  lastName: string
  email: string
  title: string
  role: RoleKey
  companies: CompanyId[]
  extra: { upload?: boolean; approve?: boolean; sign?: boolean; pay?: boolean }
  status: UserStatus
  mfa: "app" | "sms" | "pendiente"
  lastAccess?: string
  invitedAt?: string
  invitedBy?: string
  expiresAt?: string
}

export interface AuditEvent {
  id: string
  at: string
  actor: string
  action: string
  detail: string
  ip?: string
}

export type OnboardingStatus = "locked" | "available" | "in_progress" | "submitted" | "under_review" | "changes_required" | "approved" | "completed"

export interface OnboardingStep {
  id: string
  n: number
  title: string
  description: string
  owner: "cliente" | "gs"
  responsibleId: string
  dueDate: string
  status: OnboardingStatus
  requirements: string[]
  criteria: string
  note?: string
  completedAt?: string
}
