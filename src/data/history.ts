import type { CompanyId, DocTemplate, DocumentItem, FileFormat, ServiceKey } from "@/lib/types"

/**
 * Historial de entregables de GS y de documentos del cliente en 2026 (ficticio).
 * Se genera con reglas fijas para que el repositorio se vea como el de un cliente real:
 * cada mes hay estados financieros, balanza, declaraciones, DIOT, facturas de GS, etc.
 */

const COMPANIES: CompanyId[] = ["manufactura", "comercial", "logistica", "inmuebles", "servicios"]
const SHORT: Record<CompanyId, string> = { manufactura: "Manufactura", comercial: "Comercial", logistica: "Logistica", inmuebles: "Inmuebles", servicios: "Servicios" }
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
const MON = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

/** Honorarios mensuales de GS por empresa (MXN, IVA incluido). */
export const monthlyFees: Record<CompanyId, number> = { manufactura: 86_420, comercial: 52_780, logistica: 31_200, inmuebles: 23_940, servicios: 18_560 }

const pad = (n: number) => String(n).padStart(2, "0")
const key = (m: number) => `2026-${pad(m)}`
/** Fecha de publicación: día `d` del mes `m + offset` (desborda a 2027 si hace falta). */
const pub = (m: number, offset: number, d: number, time = "18:00") => {
  const month = m + offset
  return `2026-${pad(month)}-${pad(d)}T${time}`
}

/** Pseudoaleatorio determinista para tamaños y descargas. */
function rand(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}
const size = (seed: string, min: number, max: number, unit: "KB" | "MB") => {
  const v = min + rand(seed) * (max - min)
  return unit === "MB" ? `${v.toFixed(1)} MB` : `${Math.round(v)} KB`
}

interface Spec {
  id: string
  name: string
  companies: CompanyId[]
  service: ServiceKey
  m: number
  period?: string
  docType: string
  template: DocTemplate
  formats: FileFormat[]
  fileName: string
  fileSize: string
  by: string
  at: string
  visibility?: DocumentItem["visibility"]
  archived?: boolean
  folio?: string
  amount?: number
  note?: string
}

function gsDoc(s: Spec): DocumentItem {
  const downloads: DocumentItem["downloads"] = []
  // Algunas descargas históricas: Dirección consulta estados financieros y reportes; Tesorería, facturas.
  const who = s.template === "factura" ? "patricia" : s.template === "estados_financieros" || s.template === "reporte_ejecutivo" ? "ana" : "laura"
  if (rand(s.id) > 0.35) downloads.push({ personId: who, version: 1, at: s.at.replace(/T.*/, "T09:2" + Math.floor(rand(s.id + "t") * 9)), format: s.formats[0] })
  return {
    id: s.id,
    name: s.name,
    companies: s.companies,
    service: s.service,
    period: s.period ?? `${MONTHS[s.m - 1]} 2026`,
    periodKey: s.period?.includes("2025") ? `2025-${pad(s.m)}` : key(s.m),
    docType: s.docType,
    template: s.template,
    direction: "gs",
    status: "completed",
    archived: s.archived,
    formats: s.formats,
    versions: [{ version: 1, fileName: s.fileName, size: s.fileSize, uploadedBy: s.by, uploadedAt: s.at, note: s.note }],
    publishedAt: s.at,
    downloads,
    visibility: s.visibility ?? "grupo",
    folio: s.folio,
    amount: s.amount,
  }
}

function clientDoc(id: string, name: string, company: CompanyId, m: number, docType: string, fileName: string, fileSize: string, formats: FileFormat[], reviewer: string): DocumentItem {
  const uploadedAt = pub(m, 1, 8 + Math.floor(rand(id) * 4), "16:30")
  const reviewedAt = pub(m, 1, 12 + Math.floor(rand(id + "r") * 2), "11:00")
  return {
    id,
    name,
    companies: [company],
    service: "contabilidad",
    period: `${MONTHS[m - 1]} 2026`,
    periodKey: key(m),
    docType,
    direction: "cliente",
    status: "approved",
    formats,
    versions: [{ version: 1, fileName, size: fileSize, uploadedBy: "laura", uploadedAt, review: { status: "approved", by: reviewer, at: reviewedAt } }],
    requestedBy: reviewer,
    requestedAt: pub(m, 1, 1, "09:00"),
    downloads: [],
    visibility: "grupo",
  }
}

function build(): DocumentItem[] {
  const docs: DocumentItem[] = []

  for (let m = 1; m <= 10; m++) {
    const mm = pad(m)
    for (const [idx, c] of COMPANIES.entries()) {
      const tag = `${c}-2026-${mm}`
      const short = SHORT[c]

      // Factura mensual de honorarios de GS (se emite el día 5 del mismo mes).
      const folio = `A-${4821 - (10 - m) * 31 + idx}`
      docs.push(
        gsDoc({
          id: `H-FAC-${tag}`,
          name: `Factura ${folio} · Honorarios de ${MONTHS[m - 1].toLowerCase()}`,
          companies: [c],
          service: "facturacion",
          m,
          docType: "Factura de GS (CFDI)",
          template: "factura",
          formats: ["pdf", "xml"],
          fileName: `GS_${folio}.pdf`,
          fileSize: size(tag + "fac", 90, 140, "KB"),
          by: "diana",
          at: `2026-${mm}-05T08:00`,
          visibility: "restringido",
          folio,
          amount: monthlyFees[c],
        })
      )

      if (m > 8) continue // Septiembre en proceso de cierre; octubre aún no inicia.

      docs.push(
        gsDoc({
          id: `H-EF-${tag}`,
          name: "Estados financieros",
          companies: [c],
          service: "contabilidad",
          m,
          docType: "Estados financieros",
          template: "estados_financieros",
          formats: ["pdf", "xlsx"],
          fileName: `EEFF_${short}_${MON[m - 1]}2026.pdf`,
          fileSize: size(tag + "ef", 480, 760, "KB"),
          by: "luis",
          at: pub(m, 1, 22),
        }),
        gsDoc({
          id: `H-BAL-${tag}`,
          name: "Balanza de comprobación",
          companies: [c],
          service: "contabilidad",
          m,
          docType: "Balanza de comprobación",
          template: "balanza",
          formats: ["xlsx", "pdf"],
          fileName: `Balanza_${short}_${MON[m - 1]}2026.xlsx`,
          fileSize: size(tag + "bal", 180, 320, "KB"),
          by: "andrea",
          at: pub(m, 1, 22, "18:05"),
        }),
        gsDoc({
          id: `H-CE-${tag}`,
          name: "Acuse de contabilidad electrónica (balanza)",
          companies: [c],
          service: "impuestos",
          m,
          docType: "Acuse de envío",
          template: "contabilidad_electronica",
          formats: ["pdf", "xml"],
          fileName: `Acuse_CE_Balanza_${short}_${MON[m - 1]}2026.pdf`,
          fileSize: size(tag + "ce", 60, 110, "KB"),
          by: "sofia",
          at: pub(m, 2, 3, "12:00"),
        }),
        gsDoc({
          id: `H-PT-${tag}`,
          name: "Papel de trabajo: pagos provisionales",
          companies: [c],
          service: "impuestos",
          m,
          docType: "Cálculo de impuestos",
          template: "papel_trabajo",
          formats: ["xlsx"],
          fileName: `PagosProvisionales_${short}_${MON[m - 1]}2026.xlsx`,
          fileSize: size(tag + "pt", 220, 420, "KB"),
          by: "hector",
          at: pub(m, 1, 13, "16:00"),
        }),
        gsDoc({
          id: `H-DEC-${tag}`,
          name: "Declaración mensual ISR e IVA (acuse y línea de captura)",
          companies: [c],
          service: "impuestos",
          m,
          docType: "Declaración mensual",
          template: "declaracion",
          formats: ["pdf"],
          fileName: `Declaracion_${short}_${MON[m - 1]}2026.pdf`,
          fileSize: size(tag + "dec", 140, 260, "KB"),
          by: "hector",
          at: pub(m, 1, 16, "13:00"),
        }),
        gsDoc({
          id: `H-DIOT-${tag}`,
          name: "DIOT (acuse)",
          companies: [c],
          service: "impuestos",
          m,
          docType: "Declaración informativa",
          template: "diot",
          formats: ["pdf"],
          fileName: `DIOT_${short}_${MON[m - 1]}2026.pdf`,
          fileSize: size(tag + "diot", 70, 120, "KB"),
          by: "sofia",
          at: pub(m, 1, 27, "17:00"),
        })
      )

      // Lo que el cliente envió y GS aprobó.
      if (!(c === "manufactura" && m === 8)) {
        docs.push(clientDoc(`H-EDO-${tag}`, "Estados de cuenta bancarios", c, m, "Estado de cuenta", `EdoCta_${short}_${MON[m - 1]}2026.pdf`, size(tag + "edo", 1.2, 2.6, "MB"), ["pdf"], "andrea"))
      }
      docs.push(clientDoc(`H-PROV-${tag}`, "Facturas de proveedores (XML)", c, m, "CFDI de egresos", `facturas_proveedores_${MON[m - 1].toLowerCase()}2026.zip`, size(tag + "prov", 4, 19, "MB"), ["zip"], "andrea"))
      if (c === "servicios") {
        docs.push(clientDoc(`H-NOM-${tag}`, "Nómina timbrada (CFDI)", c, m, "CFDI de nómina", `nomina_${MON[m - 1].toLowerCase()}2026.zip`, size(tag + "nom", 2, 5, "MB"), ["zip"], "andrea"))
      }
    }

    if (m > 8) {
      // Opinión de cumplimiento mensual (la de octubre ya existe como DOC-305).
      if (m === 9) {
        docs.push(
          gsDoc({ id: `H-OP-2026-${mm}`, name: "Opinión de cumplimiento SAT (positiva)", companies: COMPANIES, service: "impuestos", m, docType: "Opinión de cumplimiento", template: "opinion", formats: ["pdf"], fileName: `Opinion_Cumplimiento_${MON[m - 1]}2026.pdf`, fileSize: "840 KB", by: "sofia", at: `2026-${mm}-04T10:00` })
        )
      }
      continue
    }

    // Grupo: consolidado, reporte ejecutivo y opinión de cumplimiento.
    if (m !== 8) {
      docs.push(
        gsDoc({ id: `H-EFC-2026-${mm}`, name: "Estados financieros consolidados", companies: COMPANIES, service: "contabilidad", m, docType: "Estados financieros", template: "estados_financieros", formats: ["pdf", "xlsx"], fileName: `EEFF_Consolidado_${MON[m - 1]}2026.pdf`, fileSize: size(`efc${m}`, 1.0, 1.4, "MB"), by: "luis", at: pub(m, 1, 22, "18:30") })
      )
    }
    docs.push(
      gsDoc({ id: `H-REP-2026-${mm}`, name: "Reporte ejecutivo mensual", companies: COMPANIES, service: "contabilidad", m, docType: "Presentación de resultados", template: "reporte_ejecutivo", formats: ["pptx", "pdf"], fileName: `Reporte_Ejecutivo_${MON[m - 1]}2026.pptx`, fileSize: size(`rep${m}`, 2.4, 4.1, "MB"), by: "mariana", at: pub(m, 1, 24, "12:00") }),
      gsDoc({ id: `H-OP-2026-${mm}`, name: "Opinión de cumplimiento SAT (positiva)", companies: COMPANIES, service: "impuestos", m, docType: "Opinión de cumplimiento", template: "opinion", formats: ["pdf"], fileName: `Opinion_Cumplimiento_${MON[m - 1]}2026.pdf`, fileSize: size(`op${m}`, 780, 880, "KB"), by: "sofia", at: `2026-${mm}-04T10:00` })
    )
  }

  // Proyecto de escisión: anticipo facturado en septiembre (vencido).
  docs.push(
    gsDoc({ id: "H-FAC-escision-2026-09", name: "Factura A-4795 · Anticipo proyecto de escisión", companies: ["inmuebles"], service: "facturacion", m: 9, docType: "Factura de GS (CFDI)", template: "factura", formats: ["pdf", "xml"], fileName: "GS_A-4795.pdf", fileSize: "118 KB", by: "diana", at: "2026-09-05T08:10", visibility: "restringido", folio: "A-4795", amount: 138_040 }),
    gsDoc({ id: "H-NC-manufactura-2026-09", name: "Nota de crédito NC-112 (aplica a A-4790)", companies: ["manufactura"], service: "facturacion", m: 9, docType: "Nota de crédito (CFDI)", template: "factura", formats: ["pdf", "xml"], fileName: "GS_NC-112.pdf", fileSize: "96 KB", by: "diana", at: "2026-09-12T12:30", visibility: "restringido", folio: "NC-112", amount: -14_500, note: "Se retira la revisión de precios de transferencia, no contratada en 2026." })
  )

  // Anuales del ejercicio 2025, entregados en 2026.
  for (const c of COMPANIES) {
    docs.push(
      gsDoc({ id: `H-ANUAL-${c}-2025`, name: "Declaración anual 2025 (acuse)", companies: [c], service: "impuestos", m: 3, period: "Ejercicio 2025", docType: "Declaración anual", template: "anual", formats: ["pdf"], fileName: `Anual2025_${SHORT[c]}.pdf`, fileSize: size(c + "anual", 300, 520, "KB"), by: "hector", at: "2026-03-30T17:00" }),
      gsDoc({ id: `H-CSF-${c}-2026`, name: "Constancia de situación fiscal", companies: [c], service: "impuestos", m: 1, period: "Enero 2026", docType: "Constancia SAT", template: "generico", formats: ["pdf"], fileName: `CSF_${SHORT[c]}_2026.pdf`, fileSize: "210 KB", by: "sofia", at: "2026-01-12T10:00" }),
      gsDoc({ id: `H-EFDIC-${c}-2025`, name: "Estados financieros", companies: [c], service: "contabilidad", m: 12, period: "Diciembre 2025", docType: "Estados financieros", template: "estados_financieros", formats: ["pdf", "xlsx"], fileName: `EEFF_${SHORT[c]}_Dic2025.pdf`, fileSize: size(c + "dic", 500, 780, "KB"), by: "luis", at: "2026-01-23T18:00", archived: true })
    )
  }
  for (const c of ["manufactura", "comercial"] as CompanyId[]) {
    docs.push(
      gsDoc({ id: `H-DICT-${c}-2025`, name: "Estados financieros dictaminados 2025", companies: [c], service: "auditoria", m: 4, period: "Ejercicio 2025", docType: "Dictamen", template: "dictamen", formats: ["pdf"], fileName: `Dictamen_2025_${SHORT[c]}.pdf`, fileSize: size(c + "dict", 3.2, 4.0, "MB"), by: "ricardo", at: "2026-04-28T18:00" }),
      gsDoc({ id: `H-CR-${c}-2025`, name: "Carta de recomendaciones de control interno 2025", companies: [c], service: "auditoria", m: 5, period: "Ejercicio 2025", docType: "Entregable de auditoría", template: "generico", formats: ["pdf"], fileName: `Carta_Recomendaciones_2025_${SHORT[c]}.pdf`, fileSize: "620 KB", by: "ricardo", at: "2026-05-15T13:00" })
    )
  }
  docs.push(
    gsDoc({ id: "H-CIERRE-2025", name: "Paquete de cierre contable 2025", companies: COMPANIES, service: "contabilidad", m: 12, period: "Ejercicio 2025", docType: "Cierre anual", template: "generico", formats: ["pdf", "xlsx"], fileName: "Cierre_Contable_2025_Grupo.pdf", fileSize: "6.8 MB", by: "luis", at: "2026-02-20T18:00", archived: true })
  )

  return docs
}

export const historyDocuments: DocumentItem[] = build()
