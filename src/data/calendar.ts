import type { CalendarEvent } from "@/lib/types"

const ALL = ["manufactura", "comercial", "logistica", "inmuebles", "servicios"] as const

/** Eventos del calendario. Los vencimientos de pendientes se agregan automáticamente. */
export const seedEvents: CalendarEvent[] = [
  { id: "EV-01", title: "Reunión mensual de resultados (septiembre)", type: "reunion", date: "2026-10-15", time: "10:00", endTime: "11:00", companies: [...ALL], service: "contabilidad", description: "Revisión de resultados preliminares, margen de Comercial y pendientes del cierre.", location: "Videollamada · Mariana Ortega y Luis Herrera" },
  { id: "EV-02", title: "Declaraciones mensuales ISR e IVA (septiembre)", type: "fiscal", date: "2026-10-19", companies: [...ALL], service: "impuestos", description: "Fecha límite ante el SAT. El día 17 cae en sábado, por lo que se recorre al lunes 19." },
  { id: "EV-03", title: "Cierre contable de septiembre", type: "contable", date: "2026-10-20", companies: [...ALL], service: "contabilidad", description: "Fecha objetivo para cerrar registros de las cinco empresas." },
  { id: "EV-04", title: "Sesión con notario: proyecto de escisión", type: "proyecto", date: "2026-10-20", time: "12:00", endTime: "13:00", companies: ["inmuebles"], service: "legal", description: "Validación del proyecto de acta de asamblea.", location: "Notaría 62, San Pedro Garza García" },
  { id: "EV-05", title: "Entrega de estados financieros de septiembre", type: "contable", date: "2026-10-22", companies: [...ALL], service: "contabilidad", description: "Publicación de estados financieros por empresa y consolidado." },
  { id: "EV-06", title: "Visita interina de auditoría", type: "proyecto", date: "2026-10-26", endDate: "2026-10-30", time: "09:00", companies: ["manufactura"], service: "auditoria", description: "Pruebas de control y sustantivas en planta. Equipo de 4 personas.", location: "Planta Apodaca" },
  { id: "EV-07", title: "Vence la e.firma de EcoPack Servicios", type: "renovacion", date: "2026-10-28", companies: ["servicios"], service: "impuestos", description: "Sin e.firma vigente no se pueden renovar los CSD ni presentar algunos trámites." },
  { id: "EV-08", title: "Vence la propuesta de servicios 2027", type: "contractual", date: "2026-11-15", companies: [...ALL], description: "Fecha límite para firmar la propuesta 2027 y el alta de EcoPack Desarrollos." },
  { id: "EV-09", title: "Envío de contabilidad electrónica (balanza de septiembre)", type: "fiscal", date: "2026-11-03", companies: [...ALL], service: "impuestos", description: "Envío de la balanza de comprobación al SAT." },
  { id: "EV-10", title: "Comité trimestral de dirección con GS", type: "reunion", date: "2026-11-05", time: "09:00", endTime: "11:00", companies: [...ALL], description: "Resultados del tercer trimestre, auditoría, escisión y plan 2027.", location: "Oficinas GS, Monterrey" },
  { id: "EV-11", title: "Vence el CSD de EcoPack Comercial", type: "renovacion", date: "2026-12-04", companies: ["comercial"], service: "impuestos", description: "Renovar el certificado de sello digital para seguir facturando." },
  { id: "EV-12", title: "Vence el contrato de servicios 2026", type: "contractual", date: "2026-12-31", companies: [...ALL], description: "Renovación mediante la propuesta 2027." },
  { id: "EV-13", title: "Reunión mensual de resultados (agosto)", type: "reunion", date: "2026-09-14", time: "10:00", endTime: "11:00", companies: [...ALL], description: "Revisión de resultados de agosto.", location: "Videollamada" },
  { id: "EV-14", title: "Declaraciones mensuales ISR e IVA (agosto)", type: "fiscal", date: "2026-09-17", companies: [...ALL], service: "impuestos", description: "Presentadas el 16 de septiembre." },
  { id: "EV-15", title: "Revisión de avance de la escisión", type: "reunion", date: "2026-10-13", time: "17:00", endTime: "17:30", companies: ["inmuebles"], service: "legal", description: "Llamada breve con Fernanda Robles.", location: "Llamada" },
]
