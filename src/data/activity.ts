import type { Activity, AppNotification, InsightPreview } from "@/lib/types"

const ALL = ["manufactura", "comercial", "logistica", "inmuebles", "servicios"] as const

/** "Lo que hizo GS": hitos, entregables, obligaciones y revisiones recientes. */
export const activity: Activity[] = [
  { id: "ACT-1", date: "2026-10-12", kind: "revision", title: "Revisión de estados de cuenta iniciada", detail: "EcoPack Manufactura · Septiembre", companies: ["manufactura"], service: "contabilidad", byId: "andrea", href: "/documentos/DOC-212" },
  { id: "ACT-2", date: "2026-10-09", kind: "entregable", title: "Papel de trabajo de pagos provisionales", detail: "5 empresas · listo para tu aprobación", companies: [...ALL], service: "impuestos", byId: "hector", href: "/documentos/DOC-306" },
  { id: "ACT-3", date: "2026-10-09", kind: "revision", title: "Revisión de facturas de proveedores", detail: "3 observaciones · EcoPack Manufactura", companies: ["manufactura"], service: "contabilidad", byId: "andrea", href: "/documentos/DOC-202" },
  { id: "ACT-4", date: "2026-10-05", kind: "obligacion", title: "Opinión de cumplimiento positiva", detail: "Obtenida para las 5 empresas", companies: [...ALL], service: "impuestos", byId: "sofia", href: "/documentos/DOC-305" },
  { id: "ACT-5", date: "2026-09-30", kind: "hito", title: "Planeación de auditoría concluida", detail: "Carta de planeación entregada", companies: ["manufactura", "comercial"], service: "auditoria", byId: "ricardo", href: "/documentos/DOC-307" },
  { id: "ACT-6", date: "2026-09-25", kind: "hito", title: "Estructura de escisión propuesta", detail: "Memorándum v2 con comentarios de Dirección", companies: ["inmuebles", "manufactura"], service: "legal", byId: "fernanda", href: "/documentos/DOC-308" },
  { id: "ACT-7", date: "2026-09-22", kind: "entregable", title: "Estados financieros de agosto", detail: "5 empresas y consolidado", companies: [...ALL], service: "contabilidad", byId: "luis", href: "/documentos/DOC-301" },
  { id: "ACT-8", date: "2026-09-16", kind: "obligacion", title: "Declaraciones mensuales de agosto presentadas", detail: "5 empresas · un día antes del vencimiento", companies: [...ALL], service: "impuestos", byId: "hector", href: "/documentos/H-DEC-manufactura-2026-08" },
]

/** Vista previa de insights publicados (el módulo completo llega en la Fase 2). */
export const insights: InsightPreview[] = [
  {
    id: "INS-01",
    title: "El margen bruto de Comercial bajó 2.6 puntos",
    signal: "18.4 % → 15.8 %",
    explanation: "El costo de la resina PLA subió 11 % desde julio y los precios de venta de los tres clientes principales no se han ajustado.",
    impact: "≈ $517 mil menos de utilidad bruta en septiembre",
    recommendation: "Revisar las listas de precio de los tres clientes principales antes del cierre de octubre.",
    companies: ["comercial"],
    service: "contabilidad",
    source: "ContaLink",
    period: "Septiembre 2026",
    approvedBy: "mariana",
    approvedAt: "2026-10-09",
    preliminary: true,
    conversationId: "CONV-07",
  },
  {
    id: "INS-02",
    title: "La e.firma de EcoPack Servicios vence en 16 días",
    signal: "Vence el 28 oct",
    explanation: "Sin e.firma vigente no es posible renovar los certificados de sello digital, que se necesitan para facturar.",
    impact: "Riesgo de no poder facturar los servicios al grupo",
    recommendation: "Agendar la cita en el SAT esta semana y confirmar en el pendiente.",
    companies: ["servicios"],
    service: "impuestos",
    source: "BFiskur",
    period: "Octubre 2026",
    approvedBy: "sofia",
    approvedAt: "2026-10-07",
  },
  {
    id: "INS-03",
    title: "$148 mil de IVA en riesgo por XML faltantes",
    signal: "3 facturas sin XML",
    explanation: "Tres facturas de Resinas del Bajío tienen PDF pero no XML; sin el XML el IVA no es acreditable.",
    impact: "$148,300 de IVA que se pagaría de más en septiembre",
    recommendation: "Subir los XML antes del 13 de octubre para incluirlos en el cálculo.",
    companies: ["manufactura"],
    service: "impuestos",
    source: "ContaLink",
    period: "Septiembre 2026",
    approvedBy: "hector",
    approvedAt: "2026-10-09",
    conversationId: "CONV-01",
  },
]

export const seedNotifications: AppNotification[] = [
  { id: "N-12", kind: "insight", title: "Nueva novedad de GS", description: "Paquete Económico 2027: qué revisar antes de su aprobación.", at: "2026-10-08T12:00", read: false, href: "/novedades/NOV-01", companies: ["manufactura", "comercial", "logistica", "inmuebles", "servicios"] },
  { id: "N-01", kind: "documento_revisado", title: "Recibimos facturas de ventas de Comercial", description: "GS revisará el archivo hoy.", at: "2026-10-12T08:06", read: false, href: "/documentos/DOC-213", companies: ["comercial"] },
  { id: "N-02", kind: "vencimiento", title: "Pendiente vencido: nómina de septiembre", description: "EcoPack Servicios · venció el 9 de octubre.", at: "2026-10-10T09:00", read: false, href: "/pendientes/PEN-110", companies: ["servicios"] },
  { id: "N-03", kind: "mensaje", title: "Héctor Villarreal respondió", description: "Cálculo de pagos provisionales de septiembre", at: "2026-10-10T10:45", read: false, href: "/mensajes/CONV-02", companies: ["manufactura", "comercial", "logistica", "inmuebles", "servicios"] },
  { id: "N-04", kind: "documento_revisado", title: "Corrección solicitada", description: "Facturas de proveedores de Manufactura: faltan 3 XML.", at: "2026-10-09T11:20", read: false, href: "/documentos/DOC-202", companies: ["manufactura"] },
  { id: "N-05", kind: "pendiente_nuevo", title: "Nueva aprobación pendiente", description: "Cálculo de pagos provisionales de septiembre.", at: "2026-10-09T16:30", read: true, href: "/pendientes/PEN-103", companies: ["manufactura", "comercial", "logistica", "inmuebles", "servicios"] },
  { id: "N-06", kind: "insight", title: "Nuevo análisis de GS", description: "El margen bruto de Comercial bajó 2.6 puntos.", at: "2026-10-09T18:00", read: true, href: "/mensajes/CONV-07", companies: ["comercial"] },
  { id: "N-07", kind: "mensaje", title: "Luis Herrera hizo una pregunta", description: "Depreciación de montacargas · EcoPack Logística", at: "2026-10-09T09:15", read: false, href: "/mensajes/CONV-03", companies: ["logistica"] },
  { id: "N-08", kind: "pendiente_nuevo", title: "Renovar e.firma de EcoPack Servicios", description: "Vence el 28 de octubre.", at: "2026-10-07T10:00", read: true, href: "/pendientes/PEN-104", companies: ["servicios"] },
  { id: "N-09", kind: "factura", title: "Factura A-4821 emitida", description: "Honorarios de octubre · $86,420.00 · vence el 20 oct.", at: "2026-10-05T08:00", read: true, href: "/pendientes/PEN-108", companies: ["manufactura"] },
  { id: "N-10", kind: "entregable", title: "Opinión de cumplimiento publicada", description: "Positiva para las 5 empresas.", at: "2026-10-05T10:00", read: true, href: "/documentos/DOC-305", companies: ["manufactura", "comercial", "logistica", "inmuebles", "servicios"] },
  { id: "N-11", kind: "seguridad", title: "Nuevo inicio de sesión", description: "Chrome en macOS · Monterrey, N.L.", at: "2026-10-12T08:02", read: true, href: "/notificaciones", companies: ["manufactura", "comercial", "logistica", "inmuebles", "servicios"] },
]
