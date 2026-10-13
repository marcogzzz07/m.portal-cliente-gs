import type { Company, CompanyId, CompanyMetrics, GsMember, IntegrationSource, Person, Persona, Service } from "@/lib/types"

/** Caso ficticio del Product Spec §25. RFC y datos inventados. */
export const group = {
  name: "Grupo EcoPack Norte",
  shortName: "EcoPack Norte",
  description: "Fabricante de productos desechables sostenibles",
  clientSince: "2019",
}

export const companies: Company[] = [
  { id: "manufactura", name: "EcoPack Manufactura", legalName: "EcoPack Manufactura, S.A. de C.V.", rfc: "EMA150318K92", activity: "Fabricación de empaques compostables", city: "Apodaca, N.L." },
  { id: "comercial", name: "EcoPack Comercial", legalName: "EcoPack Comercial, S.A. de C.V.", rfc: "ECO160722R14", activity: "Distribución y venta mayorista", city: "Monterrey, N.L." },
  { id: "logistica", name: "EcoPack Logística", legalName: "EcoPack Logística, S.A. de C.V.", rfc: "ELO180214T73", activity: "Almacenaje y transporte de carga", city: "Escobedo, N.L." },
  { id: "inmuebles", name: "EcoPack Inmuebles", legalName: "EcoPack Inmuebles, S.A. de C.V.", rfc: "EIN150930M48", activity: "Arrendamiento de naves industriales", city: "Apodaca, N.L." },
  { id: "servicios", name: "EcoPack Servicios", legalName: "EcoPack Servicios Corporativos, S.C.", rfc: "ESC190117H95", activity: "Servicios administrativos al grupo", city: "Monterrey, N.L." },
]

export const companyIds = companies.map((c) => c.id)

export function getCompany(id: CompanyId) {
  return companies.find((c) => c.id === id)!
}

/** Personas del cliente y de GS. Correos con dominio de ejemplo. */
export const people: Person[] = [
  // Cliente
  { id: "ana", firstName: "Ana", lastName: "Garza", title: "Directora de Finanzas", org: "cliente", email: "ana.garza@ecopack.ejemplo.mx" },
  { id: "roberto", firstName: "Roberto", lastName: "Elizondo", title: "Director General", org: "cliente", email: "roberto.elizondo@ecopack.ejemplo.mx" },
  { id: "laura", firstName: "Laura", lastName: "Medina", title: "Contralora", org: "cliente", email: "laura.medina@ecopack.ejemplo.mx" },
  { id: "jorge", firstName: "Jorge", lastName: "Salinas", title: "Representante legal", org: "cliente", email: "jorge.salinas@ecopack.ejemplo.mx" },
  { id: "patricia", firstName: "Patricia", lastName: "Ruiz", title: "Tesorería y cuentas por pagar", org: "cliente", email: "patricia.ruiz@ecopack.ejemplo.mx" },
  { id: "daniel", firstName: "Daniel", lastName: "Ochoa", title: "Gerente de Logística", org: "cliente", email: "daniel.ochoa@ecopack.ejemplo.mx" },
  // GS
  { id: "mariana", firstName: "Mariana", lastName: "Ortega", title: "Socia de relación", org: "gs", email: "mariana.ortega@gs.ejemplo.mx", phone: "81 5550 1200" },
  { id: "luis", firstName: "Luis", lastName: "Herrera", title: "Gerente de Contabilidad", org: "gs", email: "luis.herrera@gs.ejemplo.mx", phone: "81 5550 1231" },
  { id: "andrea", firstName: "Andrea", lastName: "Campos", title: "Contadora senior", org: "gs", email: "andrea.campos@gs.ejemplo.mx", phone: "81 5550 1236" },
  { id: "hector", firstName: "Héctor", lastName: "Villarreal", title: "Gerente de Impuestos", org: "gs", email: "hector.villarreal@gs.ejemplo.mx", phone: "81 5550 1244" },
  { id: "sofia", firstName: "Sofía", lastName: "Treviño", title: "Especialista fiscal", org: "gs", email: "sofia.trevino@gs.ejemplo.mx", phone: "81 5550 1247" },
  { id: "ricardo", firstName: "Ricardo", lastName: "Montemayor", title: "Socio de Auditoría", org: "gs", email: "ricardo.montemayor@gs.ejemplo.mx", phone: "81 5550 1260" },
  { id: "paola", firstName: "Paola", lastName: "Rangel", title: "Encargada de auditoría", org: "gs", email: "paola.rangel@gs.ejemplo.mx", phone: "81 5550 1262" },
  { id: "fernanda", firstName: "Fernanda", lastName: "Robles", title: "Gerente Legal Corporativo", org: "gs", email: "fernanda.robles@gs.ejemplo.mx", phone: "81 5550 1275" },
  { id: "diana", firstName: "Diana", lastName: "Castro", title: "Contraloría y cobranza", org: "gs", email: "diana.castro@gs.ejemplo.mx", phone: "81 5550 1290" },
]

export function getPerson(id: string) {
  return people.find((p) => p.id === id)!
}

/** Usuarios del cliente que se pueden simular desde el panel de demo. */
export const personas: Persona[] = [
  { personId: "ana", role: "admin", companies: companyIds, scenario: "Administra el portal del grupo; ve todo y aprueba." },
  { personId: "roberto", role: "ejecutivo", companies: companyIds, scenario: "Dirección: visión consolidada, aprueba y firma." },
  { personId: "laura", role: "operativo", companies: companyIds, scenario: "Carga documentos y responde a GS; sin facturación." },
  { personId: "jorge", role: "firmante", companies: companyIds, scenario: "Solo ve lo que debe firmar y su contexto." },
  { personId: "patricia", role: "pagos", companies: companyIds, scenario: "Facturas, pagos y aclaraciones." },
  { personId: "daniel", role: "consulta", companies: ["logistica"], scenario: "Solo consulta y solo EcoPack Logística." },
]

export const gsTeam: GsMember[] = [
  { personId: "mariana", area: "Dirección de la relación", materia: "Contacto principal del grupo; coordina todos los servicios", services: ["contabilidad", "impuestos", "auditoria", "legal"], companies: "all", primary: true },
  { personId: "luis", area: "Contabilidad", materia: "Cierre mensual, estados financieros y consolidación", services: ["contabilidad"], companies: "all" },
  { personId: "andrea", area: "Contabilidad", materia: "Revisión documental, conciliaciones y registros", services: ["contabilidad"], companies: ["manufactura", "comercial", "servicios"] },
  {
    personId: "hector",
    area: "Impuestos",
    materia: "Pagos provisionales, declaraciones y planeación fiscal",
    services: ["impuestos"],
    companies: "all",
    away: { from: "2026-10-20", to: "2026-10-23", substituteId: "sofia", note: "Vacaciones. Sofía Treviño atiende los temas de impuestos." },
  },
  { personId: "sofia", area: "Impuestos", materia: "Cumplimiento, e.firma, CSD y opiniones de cumplimiento", services: ["impuestos"], companies: "all" },
  { personId: "ricardo", area: "Auditoría", materia: "Auditoría de estados financieros 2026", services: ["auditoria"], companies: ["manufactura", "comercial"] },
  { personId: "paola", area: "Auditoría", materia: "Solicitudes de evidencia y visitas", services: ["auditoria"], companies: ["manufactura", "comercial"] },
  { personId: "fernanda", area: "Legal Corporativo", materia: "Escisión de EcoPack Inmuebles y asuntos societarios", services: ["legal"], companies: ["inmuebles", "manufactura"] },
  { personId: "diana", area: "Contraloría GS", materia: "Facturas de GS, aclaraciones y pagos", services: ["facturacion"], companies: "all" },
]

export const services: Service[] = [
  {
    id: "svc-contabilidad",
    key: "contabilidad",
    name: "Contabilidad mensual",
    kind: "recurrente",
    companies: companyIds,
    period: "Septiembre 2026",
    leadId: "luis",
    summary: "Registro, cierre mensual y estados financieros de las cinco empresas.",
    health: { manufactura: "requiere_atencion", comercial: "requiere_atencion", logistica: "en_curso", inmuebles: "al_corriente", servicios: "atrasado" },
    nextMilestone: { title: "Publicación de estados financieros de septiembre", date: "2026-10-22" },
    detailPhase: 2,
  },
  {
    id: "svc-impuestos",
    key: "impuestos",
    name: "Impuestos",
    kind: "recurrente",
    companies: companyIds,
    period: "Septiembre 2026",
    leadId: "hector",
    summary: "Pagos provisionales, declaraciones informativas y cumplimiento.",
    health: { manufactura: "requiere_atencion", comercial: "en_curso", logistica: "en_curso", inmuebles: "en_curso", servicios: "requiere_atencion" },
    nextMilestone: { title: "Declaraciones mensuales de septiembre", date: "2026-10-19" },
    detailPhase: 2,
  },
  {
    id: "svc-auditoria",
    key: "auditoria",
    name: "Auditoría de estados financieros 2026",
    kind: "proyecto",
    companies: ["manufactura", "comercial"],
    period: "Ejercicio 2026",
    leadId: "ricardo",
    summary: "Etapa actual: planeación concluida, preparación de visita interina.",
    health: { manufactura: "en_curso", comercial: "en_curso" },
    nextMilestone: { title: "Visita interina en planta", date: "2026-10-26" },
    detailPhase: 2,
  },
  {
    id: "svc-legal",
    key: "legal",
    name: "Escisión de EcoPack Inmuebles",
    kind: "proyecto",
    companies: ["inmuebles", "manufactura"],
    period: "Jul – Dic 2026",
    leadId: "fernanda",
    summary: "Separación de las naves industriales en una nueva sociedad.",
    health: { inmuebles: "requiere_atencion", manufactura: "en_curso" },
    nextMilestone: { title: "Validación del proyecto de acta con notario", date: "2026-10-20" },
    detailPhase: 2,
  },
]

export const serviceNames: Record<string, string> = {
  contabilidad: "Contabilidad",
  impuestos: "Impuestos",
  auditoria: "Auditoría",
  legal: "Legal",
  facturacion: "Facturación GS",
}

/** Indicadores autorizados por empresa (MXN). Ene–ago cerrado; septiembre preliminar. */
export const metrics: Record<CompanyId, CompanyMetrics> = {
  manufactura: { revenueYtd: 214_600_000, revenueSep: 29_800_000, revenueSepPrev: 27_900_000, grossMargin: 0.312, compliance: { onTime: 27, total: 27, late: [] }, deliverables: { published: 2, expected: 4 }, balance: { due: 86_420, overdue: 0 } },
  comercial: { revenueYtd: 138_200_000, revenueSep: 19_900_000, revenueSepPrev: 18_600_000, grossMargin: 0.184, compliance: { onTime: 27, total: 27, late: [] }, deliverables: { published: 2, expected: 3 }, balance: { due: 52_780, overdue: 0 } },
  logistica: { revenueYtd: 31_400_000, revenueSep: 4_200_000, revenueSepPrev: 4_000_000, grossMargin: 0.22, compliance: { onTime: 26, total: 27, late: ["DIOT de marzo, presentada con 2 días de retraso"] }, deliverables: { published: 2, expected: 3 }, balance: { due: 0, overdue: 0 } },
  inmuebles: { revenueYtd: 16_800_000, revenueSep: 2_100_000, revenueSepPrev: 2_100_000, grossMargin: 0.715, compliance: { onTime: 27, total: 27, late: [] }, deliverables: { published: 3, expected: 3 }, balance: { due: 0, overdue: 138_040 } },
  servicios: { revenueYtd: 12_100_000, revenueSep: 1_600_000, revenueSepPrev: 1_500_000, grossMargin: 0.098, compliance: { onTime: 25, total: 27, late: ["ISR retenido de mayo, complementaria", "DIOT de mayo, presentada con 1 día de retraso"] }, deliverables: { published: 0, expected: 2 }, balance: { due: 18_560, overdue: 0 } },
}

export const integrations: IntegrationSource[] = [
  { key: "contalink", name: "ContaLink", lastSync: "2026-10-12T08:10", fallbackSync: "2026-10-11T08:10" },
  { key: "odoo", name: "Odoo", lastSync: "2026-10-12T07:45", fallbackSync: "2026-10-12T07:45" },
  { key: "auditbrain", name: "AuditBrain", lastSync: "2026-10-11T19:00", fallbackSync: "2026-10-11T19:00" },
  { key: "bfiskur", name: "BFiskur", lastSync: "2026-10-12T06:00", fallbackSync: "2026-10-12T06:00" },
]
