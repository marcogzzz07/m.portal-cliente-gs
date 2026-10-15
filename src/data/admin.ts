import type { AuditEvent, ClientUser, Contract, Invoice, OnboardingStep, ProposalLine } from "@/lib/types"

import { historyDocuments, monthlyFees } from "./history"

/* ─── Propuestas y contratos ─────────────────────────────────────────────── */

const SHORT = { manufactura: "EcoPack Manufactura", comercial: "EcoPack Comercial", logistica: "EcoPack Logística", inmuebles: "EcoPack Inmuebles", servicios: "EcoPack Servicios" } as const

/** Honorarios 2027: honorarios mensuales 2026 sin IVA + 4.5 % de ajuste anual. */
const lines2027: ProposalLine[] = [
  ...Object.entries(monthlyFees).flatMap(([c, fee]) => {
    const net = Math.round(((fee / 1.16) * 1.045) / 10) * 10
    return [
      { company: SHORT[c as keyof typeof SHORT], service: "Contabilidad mensual", scope: "Registro, conciliaciones, cierre y estados financieros al día 22", periodicity: "Mensual" as const, fee: Math.round(net * 0.62) },
      { company: SHORT[c as keyof typeof SHORT], service: "Impuestos", scope: "Pagos provisionales, DIOT, contabilidad electrónica y declaración anual", periodicity: "Mensual" as const, fee: Math.round(net * 0.38) },
    ]
  }),
  { company: "EcoPack Manufactura", service: "Auditoría de estados financieros 2027", scope: "Dictamen financiero y carta de recomendaciones", periodicity: "Anual", fee: 486_000 },
  { company: "EcoPack Comercial", service: "Auditoría de estados financieros 2027", scope: "Dictamen financiero y carta de recomendaciones", periodicity: "Anual", fee: 318_000 },
  { company: "EcoPack Desarrollos (nueva)", service: "Contabilidad mensual", scope: "A partir de su inscripción en el RFC", periodicity: "Mensual", fee: 17_800 },
  { company: "EcoPack Desarrollos (nueva)", service: "Impuestos", scope: "A partir de su inscripción en el RFC", periodicity: "Mensual", fee: 10_900 },
  { company: "EcoPack Desarrollos (nueva)", service: "Alta e incorporación", scope: "Inscripción, e.firma, CSD, catálogo de cuentas y saldos iniciales", periodicity: "Proyecto", fee: 45_000 },
]

export const seedContracts: Contract[] = [
  {
    id: "PRO-2027",
    kind: "Propuesta",
    title: "Propuesta de servicios 2027 y alta de EcoPack Desarrollos",
    summary: "Renovación de Contabilidad, Impuestos y Auditoría para las cinco empresas, más la incorporación de EcoPack Desarrollos, la sociedad que nace de la escisión.",
    companies: ["EcoPack Manufactura", "EcoPack Comercial", "EcoPack Logística", "EcoPack Inmuebles", "EcoPack Servicios", "EcoPack Desarrollos (nueva)"],
    status: "sent",
    version: 2,
    sentAt: "2026-10-09T12:00",
    validUntil: "2026-11-15",
    ownerId: "mariana",
    startDate: "2027-01-01",
    endDate: "2027-12-31",
    advance: 45_000,
    signers: [
      { personId: "roberto", capacity: "Director General", org: "cliente", status: "pendiente" },
      { personId: "jorge", capacity: "Representante legal", org: "cliente", status: "pendiente" },
      { personId: "mariana", capacity: "Socia de relación, GS", org: "gs", status: "pendiente" },
    ],
    approvals: [],
    lines: lines2027,
    exclusions: [
      "Estudio de precios de transferencia (se cotiza por separado)",
      "Cálculo y timbrado de nómina",
      "Auditoría de EcoPack Logística, Inmuebles, Servicios y Desarrollos",
      "Defensa fiscal y litigio",
    ],
    deliverables: [
      "Estados financieros mensuales por empresa y consolidado, a más tardar el día 22",
      "Reporte ejecutivo mensual para Dirección",
      "Acuses de declaraciones mensuales, DIOT y contabilidad electrónica",
      "Declaración anual 2027 de cada empresa",
      "Dictamen financiero 2027 de Manufactura y Comercial",
    ],
    conditions: [
      "Vigencia del 1 de enero al 31 de diciembre de 2027.",
      "Honorarios mensuales más IVA, facturados el día 5 y pagaderos a 15 días.",
      "El alta de EcoPack Desarrollos se factura como anticipo al firmar la propuesta.",
      "La propuesta vence el 15 de noviembre de 2026.",
    ],
    conversationId: undefined,
    history: [
      { at: "2026-10-02T10:00", text: "GS envió la versión 1", by: "mariana" },
      { at: "2026-10-05T17:20", text: "Ana Garza pidió ajustar los honorarios de EcoPack Servicios", by: "ana" },
      { at: "2026-10-09T12:00", text: "GS envió la versión 2 con el ajuste", by: "mariana" },
    ],
  },
  {
    id: "ACTA-ESC",
    kind: "Acta",
    title: "Acta de asamblea extraordinaria: escisión de EcoPack Inmuebles",
    summary: "Aprueba la escisión y la constitución de EcoPack Desarrollos. Se habilita para firma cuando el notario valide el proyecto.",
    companies: ["EcoPack Inmuebles"],
    status: "draft",
    version: 1,
    ownerId: "fernanda",
    signers: [
      { personId: "jorge", capacity: "Representante legal", org: "cliente", status: "pendiente" },
      { personId: "fernanda", capacity: "Gerente Legal Corporativo, GS", org: "gs", status: "pendiente" },
    ],
    approvals: [],
    conversationId: "CONV-06",
    history: [{ at: "2026-10-05T09:30", text: "Proyecto enviado al notario para validación", by: "fernanda" }],
  },
  {
    id: "CON-2026",
    kind: "Contrato",
    title: "Contrato de prestación de servicios 2026",
    summary: "Contabilidad e Impuestos para las cinco empresas durante 2026.",
    companies: ["Grupo EcoPack Norte · 5 empresas"],
    status: "completed",
    version: 1,
    sentAt: "2026-01-08T10:00",
    ownerId: "mariana",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    signers: [
      { personId: "roberto", capacity: "Director General", org: "cliente", status: "firmado", signedAt: "2026-01-15T12:30" },
      { personId: "mariana", capacity: "Socia de relación, GS", org: "gs", status: "firmado", signedAt: "2026-01-15T12:40" },
    ],
    approvals: [{ personId: "ana", at: "2026-01-12T09:00" }],
    documentId: "DOC-401",
    history: [
      { at: "2026-01-08T10:00", text: "GS envió el contrato", by: "mariana" },
      { at: "2026-01-15T12:40", text: "Firma completada", by: "mariana" },
    ],
  },
  {
    id: "CAR-AUD-2026",
    kind: "Carta compromiso",
    title: "Carta compromiso de auditoría 2026",
    summary: "Alcance, responsabilidades y calendario de la auditoría de Manufactura y Comercial.",
    companies: ["EcoPack Manufactura", "EcoPack Comercial"],
    status: "completed",
    version: 1,
    sentAt: "2026-07-01T10:00",
    ownerId: "ricardo",
    signers: [
      { personId: "roberto", capacity: "Director General", org: "cliente", status: "firmado", signedAt: "2026-07-08T16:50" },
      { personId: "ricardo", capacity: "Socio de Auditoría, GS", org: "gs", status: "firmado", signedAt: "2026-07-08T17:05" },
    ],
    approvals: [],
    documentId: "DOC-402",
    history: [{ at: "2026-07-08T17:05", text: "Firma completada", by: "ricardo" }],
  },
  {
    id: "NDA-ESC",
    kind: "Acuerdo",
    title: "Acuerdo de confidencialidad: proyecto de escisión",
    summary: "Confidencialidad sobre la información del proyecto de escisión.",
    companies: ["EcoPack Inmuebles"],
    status: "completed",
    version: 1,
    sentAt: "2026-08-18T10:00",
    ownerId: "fernanda",
    signers: [
      { personId: "jorge", capacity: "Representante legal", org: "cliente", status: "firmado", signedAt: "2026-08-20T11:20" },
      { personId: "fernanda", capacity: "Gerente Legal Corporativo, GS", org: "gs", status: "firmado", signedAt: "2026-08-20T11:30" },
    ],
    approvals: [],
    documentId: "DOC-403",
    history: [{ at: "2026-08-20T11:30", text: "Firma completada", by: "fernanda" }],
  },
  {
    id: "PRO-PT-2026",
    kind: "Propuesta",
    title: "Propuesta: estudio de precios de transferencia 2026",
    summary: "Documentación de operaciones entre empresas del grupo.",
    companies: ["Grupo EcoPack Norte · 5 empresas"],
    status: "expired",
    version: 1,
    sentAt: "2026-02-15T10:00",
    validUntil: "2026-03-31",
    ownerId: "hector",
    signers: [{ personId: "roberto", capacity: "Director General", org: "cliente", status: "pendiente" }],
    approvals: [],
    lines: [{ company: "Grupo EcoPack Norte", service: "Estudio de precios de transferencia", scope: "Rentas, servicios administrativos y fletes intercompañía", periodicity: "Proyecto", fee: 220_000 }],
    history: [
      { at: "2026-02-15T10:00", text: "GS envió la propuesta", by: "hector" },
      { at: "2026-03-31T23:59", text: "La propuesta venció sin firmarse" },
    ],
  },
  {
    id: "PRO-DDL",
    kind: "Propuesta",
    title: "Propuesta: diagnóstico laboral de EcoPack Logística",
    summary: "Revisión de contratos, turnos y prestaciones del personal operativo.",
    companies: ["EcoPack Logística"],
    status: "declined",
    version: 1,
    sentAt: "2026-05-28T10:00",
    validUntil: "2026-06-30",
    ownerId: "mariana",
    signers: [{ personId: "roberto", capacity: "Director General", org: "cliente", status: "rechazado" }],
    approvals: [],
    declineReason: "Lo realizará el área de Recursos Humanos internamente este año.",
    lines: [{ company: "EcoPack Logística", service: "Diagnóstico laboral", scope: "Contratos, turnos, prestaciones y riesgos", periodicity: "Proyecto", fee: 96_000 }],
    history: [
      { at: "2026-05-28T10:00", text: "GS envió la propuesta", by: "mariana" },
      { at: "2026-06-10T13:00", text: "Roberto Elizondo rechazó la propuesta", by: "roberto" },
    ],
  },
]

/* ─── Facturas (fuente: Odoo) ────────────────────────────────────────────── */

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  const date = new Date(y, m - 1, d + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function buildInvoices(): Invoice[] {
  return historyDocuments
    .filter((d) => d.service === "facturacion" && (d.amount ?? 0) > 0)
    .map((d) => {
      const issuedAt = d.publishedAt!
      const month = Number(d.periodKey!.slice(5, 7))
      const inv: Invoice = {
        id: d.folio!,
        folio: d.folio!,
        documentId: d.id,
        company: d.companies[0],
        concept: d.name.split(" · ")[1] ?? d.name,
        period: d.period,
        issuedAt,
        dueDate: addDays(issuedAt, 15),
        total: d.amount!,
        payments: [],
      }
      const paid = (at: string, amount = inv.total, method: "transferencia" | "tarjeta" = "transferencia") =>
        inv.payments.push({ id: `PAG-${inv.folio}`, amount, method, status: "applied", at, by: "patricia", reference: method === "tarjeta" ? `AUT-${inv.folio.replace("A-", "")}${month}` : `SPEI ${inv.folio.replace("A-", "")}${month}` })

      if (inv.folio === "A-4795") return inv // Anticipo de escisión: vencido.
      if (inv.folio === "A-4790") {
        inv.creditNote = { folio: "NC-112", amount: 14_500 }
        inv.dispute = { reason: "Concepto no contratado", comment: "Incluye la revisión de precios de transferencia, que no se contrató en 2026.", openedAt: "2026-09-12T10:00", openedBy: "patricia", ownerId: "diana", expectedBy: "2026-09-15", conversationId: "CONV-04", status: "resuelta" }
        paid("2026-09-19T11:00", inv.total - 14_500)
        return inv
      }
      if (month <= 9) paid(`${addDays(issuedAt, 11)}T11:00`)
      if (month === 10 && inv.company === "logistica") paid("2026-10-08T10:30", inv.total, "tarjeta")
      return inv
    })
}

export const seedInvoices: Invoice[] = buildInvoices()

/* ─── Usuarios del cliente ───────────────────────────────────────────────── */

const ALL = ["manufactura", "comercial", "logistica", "inmuebles", "servicios"] as const

export const seedUsers: ClientUser[] = [
  { id: "U-ana", personId: "ana", firstName: "Ana", lastName: "Garza", email: "ana.garza@ecopack.ejemplo.mx", title: "Directora de Finanzas", role: "admin", companies: [...ALL], extra: {}, status: "activo", mfa: "app", lastAccess: "2026-10-12T08:02" },
  { id: "U-roberto", personId: "roberto", firstName: "Roberto", lastName: "Elizondo", email: "roberto.elizondo@ecopack.ejemplo.mx", title: "Director General", role: "ejecutivo", companies: [...ALL], extra: { sign: true }, status: "activo", mfa: "app", lastAccess: "2026-10-10T08:30" },
  { id: "U-laura", personId: "laura", firstName: "Laura", lastName: "Medina", email: "laura.medina@ecopack.ejemplo.mx", title: "Contralora", role: "operativo", companies: [...ALL], extra: {}, status: "activo", mfa: "app", lastAccess: "2026-10-12T07:55" },
  { id: "U-jorge", personId: "jorge", firstName: "Jorge", lastName: "Salinas", email: "jorge.salinas@ecopack.ejemplo.mx", title: "Representante legal", role: "firmante", companies: [...ALL], extra: {}, status: "activo", mfa: "sms", lastAccess: "2026-10-05T11:00" },
  { id: "U-patricia", personId: "patricia", firstName: "Patricia", lastName: "Ruiz", email: "patricia.ruiz@ecopack.ejemplo.mx", title: "Tesorería y cuentas por pagar", role: "pagos", companies: [...ALL], extra: {}, status: "activo", mfa: "app", lastAccess: "2026-10-09T16:40" },
  { id: "U-daniel", personId: "daniel", firstName: "Daniel", lastName: "Ochoa", email: "daniel.ochoa@ecopack.ejemplo.mx", title: "Gerente de Logística", role: "consulta", companies: ["logistica"], extra: {}, status: "activo", mfa: "app", lastAccess: "2026-09-25T11:18" },
  { id: "U-carmen", personId: "carmen", firstName: "Carmen", lastName: "Villarreal", email: "carmen.villarreal@ecopack.ejemplo.mx", title: "Contadora general", role: "operativo", companies: ["manufactura", "comercial"], extra: {}, status: "invitado", mfa: "pendiente", invitedAt: "2026-10-11T17:00", invitedBy: "ana", expiresAt: "2026-10-18" },
  { id: "U-miguel", firstName: "Miguel", lastName: "Treviño", email: "miguel.trevino@ecopack.ejemplo.mx", title: "Ex contador de costos", role: "operativo", companies: ["manufactura"], extra: {}, status: "suspendido", mfa: "app", lastAccess: "2026-08-29T18:10" },
]

export const seedAudit: AuditEvent[] = [
  { id: "A-1", at: "2026-10-12T08:02", actor: "Ana Garza", action: "Inicio de sesión", detail: "Chrome en macOS · MFA por app", ip: "187.190.xx.xx" },
  { id: "A-2", at: "2026-10-11T17:00", actor: "Ana Garza", action: "Invitó a un usuario", detail: "Carmen Villarreal · Responsable operativo · Manufactura y Comercial" },
  { id: "A-3", at: "2026-10-10T12:15", actor: "Laura Medina", action: "Subió un documento", detail: "Estados de cuenta bancarios · Manufactura · v1" },
  { id: "A-4", at: "2026-10-06T09:30", actor: "Patricia Ruiz", action: "Descargó un documento", detail: "Opinión de cumplimiento SAT · octubre" },
  { id: "A-5", at: "2026-09-30T18:00", actor: "Ana Garza", action: "Suspendió a un usuario", detail: "Miguel Treviño · baja de la empresa" },
  { id: "A-6", at: "2026-09-19T11:00", actor: "Patricia Ruiz", action: "Registró un pago", detail: "A-4790 · $71,920.00 · transferencia" },
  { id: "A-7", at: "2026-09-14T18:10", actor: "Ana Garza", action: "Aprobó un cálculo", detail: "Pagos provisionales de agosto · 5 empresas" },
]

/* ─── Incorporación de EcoPack Desarrollos ───────────────────────────────── */

export const onboardingCompany = {
  name: "EcoPack Desarrollos",
  legalName: "EcoPack Desarrollos, S.A. de C.V.",
  origin: "Sociedad escindida de EcoPack Inmuebles",
}

export const seedOnboarding: OnboardingStep[] = [
  { id: "OB-1", n: 1, title: "Activar acceso y MFA", description: "Los usuarios que administrarán EcoPack Desarrollos tienen acceso activo con MFA.", owner: "cliente", responsibleId: "ana", dueDate: "2026-10-05", status: "completed", requirements: ["Invitación aceptada", "MFA configurado"], criteria: "Al menos un administrador activo con MFA.", completedAt: "2026-10-02T09:00" },
  { id: "OB-2", n: 2, title: "Confirmar grupo y razones sociales", description: "Confirma que EcoPack Desarrollos forma parte del Grupo EcoPack Norte.", owner: "cliente", responsibleId: "ana", dueDate: "2026-10-07", status: "completed", requirements: ["Estructura del grupo revisada"], criteria: "Estructura confirmada por el administrador.", completedAt: "2026-10-03T12:00" },
  { id: "OB-3", n: 3, title: "Aceptar avisos", description: "Aviso de privacidad y términos de uso del portal para la nueva empresa.", owner: "cliente", responsibleId: "ana", dueDate: "2026-10-07", status: "completed", requirements: ["Aviso de privacidad", "Términos de uso"], criteria: "Avisos aceptados por el administrador.", completedAt: "2026-10-03T12:05" },
  { id: "OB-4", n: 4, title: "Firmar propuesta y contratos", description: "La propuesta 2027 incluye el alta de EcoPack Desarrollos.", owner: "cliente", responsibleId: "roberto", dueDate: "2026-11-15", status: "available", requirements: ["Firma del Director General", "Firma del representante legal"], criteria: "Propuesta firmada por todos los firmantes." },
  { id: "OB-5", n: 5, title: "Confirmar datos fiscales y de facturación", description: "Datos con los que GS dará de alta a la empresa y le facturará.", owner: "cliente", responsibleId: "laura", dueDate: "2026-10-23", status: "in_progress", requirements: ["Razón social y régimen", "Domicilio fiscal", "Correo para facturas"], criteria: "GS valida que los datos coinciden con el acta y la constancia." },
  { id: "OB-6", n: 6, title: "Registrar contactos y usuarios", description: "Quién tendrá acceso a la información de EcoPack Desarrollos.", owner: "cliente", responsibleId: "ana", dueDate: "2026-10-23", status: "available", requirements: ["Al menos un responsable operativo", "Contacto de facturación"], criteria: "Usuarios con rol asignado para la nueva empresa." },
  { id: "OB-7", n: 7, title: "Cargar documentación inicial", description: "Documentos legales y fiscales para el alta.", owner: "cliente", responsibleId: "jorge", dueDate: "2026-10-30", status: "available", requirements: ["Acta de escisión protocolizada", "Poder del representante legal", "Identificación del representante legal", "Comprobante de domicilio fiscal"], criteria: "GS revisa que los documentos estén completos y legibles." },
  { id: "OB-8", n: 8, title: "Cubrir el anticipo", description: "Anticipo del alta e incorporación ($45,000 más IVA).", owner: "cliente", responsibleId: "patricia", dueDate: "2026-11-20", status: "locked", requirements: ["Propuesta firmada"], criteria: "Odoo confirma la aplicación del pago." },
  { id: "OB-9", n: 9, title: "Agendar la reunión de arranque", description: "Kickoff con el equipo de GS para la nueva empresa.", owner: "cliente", responsibleId: "ana", dueDate: "2026-11-30", status: "available", requirements: ["Reunión agendada con GS"], criteria: "Reunión confirmada por GS." },
  { id: "OB-10", n: 10, title: "Activar servicios", description: "GS activa Contabilidad e Impuestos para EcoPack Desarrollos.", owner: "gs", responsibleId: "mariana", dueDate: "2026-12-04", status: "locked", requirements: ["Pasos 1 a 9 completos"], criteria: "Servicios activos y primeras solicitudes publicadas." },
]
