import type { ActionItem, CompanyId, Conversation, DocumentItem, Persona, RoleKey, Scope } from "./types"

export type ModuleKey =
  | "inicio"
  | "pendientes"
  | "calendario"
  | "servicios"
  | "documentos"
  | "contratos"
  | "facturacion"
  | "mensajes"
  | "novedades"
  | "equipo"
  | "usuarios"
  | "notificaciones"
  | "onboarding"

export interface Capabilities {
  upload: boolean
  approve: boolean
  sign: boolean
  pay: boolean
  respond: boolean
  adminUsers: boolean
}

interface RoleMeta {
  label: string
  description: string
  modules: ModuleKey[]
  can: Capabilities
}

/** Roles base del Product Spec §6. Las capacidades "configurables" se fijan aquí para la simulación. */
export const roles: Record<RoleKey, RoleMeta> = {
  admin: {
    label: "Administrador del cliente",
    description: "Consulta todo, carga, aprueba, paga y administra usuarios.",
    modules: ["inicio", "pendientes", "calendario", "servicios", "documentos", "contratos", "facturacion", "mensajes", "novedades", "equipo", "usuarios", "notificaciones", "onboarding"],
    can: { upload: true, approve: true, sign: false, pay: true, respond: true, adminUsers: true },
  },
  ejecutivo: {
    label: "Ejecutivo",
    description: "Visión consolidada; aprueba y firma. No carga documentos.",
    modules: ["inicio", "pendientes", "calendario", "servicios", "documentos", "contratos", "facturacion", "mensajes", "novedades", "equipo", "notificaciones", "onboarding"],
    can: { upload: false, approve: true, sign: true, pay: false, respond: true, adminUsers: false },
  },
  operativo: {
    label: "Responsable operativo",
    description: "Carga documentos y responde a GS. Sin facturación ni contratos.",
    modules: ["inicio", "pendientes", "calendario", "servicios", "documentos", "mensajes", "novedades", "equipo", "notificaciones", "onboarding"],
    can: { upload: true, approve: false, sign: false, pay: false, respond: true, adminUsers: false },
  },
  firmante: {
    label: "Firmante autorizado",
    description: "Ve lo que debe firmar, su contexto y los documentos firmados.",
    modules: ["inicio", "pendientes", "calendario", "documentos", "contratos", "mensajes", "novedades", "equipo", "notificaciones"],
    can: { upload: false, approve: false, sign: true, pay: false, respond: true, adminUsers: false },
  },
  pagos: {
    label: "Facturación y pagos",
    description: "Facturas, pagos, comprobantes y aclaraciones.",
    modules: ["inicio", "pendientes", "calendario", "documentos", "facturacion", "mensajes", "novedades", "equipo", "notificaciones"],
    can: { upload: false, approve: false, sign: false, pay: true, respond: true, adminUsers: false },
  },
  consulta: {
    label: "Solo consulta",
    description: "Consulta información autorizada; no realiza acciones.",
    modules: ["inicio", "calendario", "servicios", "documentos", "novedades", "equipo", "notificaciones"],
    can: { upload: false, approve: false, sign: false, pay: false, respond: false, adminUsers: false },
  },
}

export function canAccessModule(persona: Persona, module: ModuleKey) {
  return roles[persona.role].modules.includes(module)
}

/** La empresa o empresas de un registro coinciden con el contexto activo y con las empresas asignadas. */
export function matchesScope(companies: CompanyId[], scope: Scope, allowed: CompanyId[]) {
  const visible = companies.filter((c) => allowed.includes(c))
  if (visible.length === 0) return false
  return scope === "grupo" ? true : visible.includes(scope)
}

export function canSeeAction(persona: Persona, item: ActionItem) {
  if (!canAccessModule(persona, "pendientes")) return false
  if (!item.companies.some((c) => persona.companies.includes(c))) return false
  if (item.assigneeId === persona.personId) return true
  switch (persona.role) {
    case "admin":
    case "ejecutivo":
      return true
    case "operativo":
      return item.kind !== "pagar" && item.kind !== "firmar" && item.service !== "facturacion" && item.service !== "legal"
    case "firmante":
      return item.kind === "firmar" || item.service === "legal"
    case "pagos":
      return item.kind === "pagar" || item.service === "facturacion"
    default:
      return false
  }
}

/** ¿Puede esta persona ejecutar la acción principal del pendiente? */
export function canActOn(persona: Persona, item: ActionItem) {
  const can = roles[persona.role].can
  if (item.owner === "gs" && item.status !== "changes_required") return false
  switch (item.kind) {
    case "subir":
      return can.upload
    case "aprobar":
      return can.approve
    case "firmar":
      return can.sign
    case "pagar":
      return can.pay
    case "responder":
    case "confirmar":
      return can.respond && (item.assigneeId === persona.personId || persona.role === "admin" || persona.role === "operativo" || persona.role === "ejecutivo")
  }
}

export function canSeeDocument(persona: Persona, doc: DocumentItem) {
  if (!doc.companies.some((c) => persona.companies.includes(c))) return false
  switch (persona.role) {
    case "admin":
    case "ejecutivo":
      return true
    case "operativo":
      return doc.service !== "legal" && doc.service !== "facturacion"
    case "firmante":
      return Boolean(doc.signed) || doc.service === "legal"
    case "pagos":
      return doc.service === "impuestos" || doc.service === "facturacion" || Boolean(doc.signed)
    case "consulta":
      return doc.direction === "gs" && doc.visibility === "grupo" && !doc.signed
  }
}

export function canSeeConversation(persona: Persona, conv: Conversation) {
  if (!conv.companies.some((c) => persona.companies.includes(c))) return false
  if (persona.role === "admin" || persona.role === "ejecutivo") return true
  return conv.participants.includes(persona.personId)
}
