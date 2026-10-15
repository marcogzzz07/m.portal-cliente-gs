import { companies, getPerson, metrics } from "@/data/organization"
import { formatCurrency, formatDate } from "./format"
import type { CompanyId, DocumentItem } from "./types"

/**
 * Contenido "impreso" de un entregable ficticio. Lo usan la vista previa y la descarga en PDF,
 * para que ambos muestren exactamente lo mismo.
 */
export interface DocTable {
  heading: string
  columns: string[]
  rows: string[][]
  total?: string[]
}

export interface DocContent {
  title: string
  subtitle: string
  issuer: string
  meta: [string, string][]
  tables: DocTable[]
  notes: string[]
}

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
/** Estacionalidad mensual de ventas (empaques: más demanda en temporada alta). */
const SEASON = [0.86, 0.88, 0.97, 0.98, 1.02, 1.04, 1.06, 1.08, 1.11, 1.1, 1.0, 0.9]

const money = (v: number) => formatCurrency(v, 0)
const pct = (v: number) => `${(v * 100).toFixed(1)} %`

function rnd(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

function monthOf(doc: DocumentItem) {
  const k = doc.periodKey ?? "2026-08"
  return { year: Number(k.slice(0, 4)), m: Number(k.slice(5, 7)) }
}

/** Ingreso mensual estimado de una empresa a partir del acumulado ene–ago. */
function monthRevenue(c: CompanyId, m: number) {
  const base = metrics[c].revenueYtd / SEASON.slice(0, 8).reduce((a, b) => a + b, 0)
  return Math.round(base * SEASON[m - 1])
}

function fakeOp(seed: string, len = 12) {
  return String(Math.floor(rnd(seed) * 10 ** len)).padStart(len, "7")
}

function companyRows(doc: DocumentItem) {
  return doc.companies.map((id) => companies.find((c) => c.id === id)!)
}

export function documentContent(doc: DocumentItem): DocContent {
  const { year, m } = monthOf(doc)
  const periodText = `${MONTHS[m - 1]} de ${year}`
  const cs = companyRows(doc)
  const single = cs.length === 1 ? cs[0] : null
  const who = single ? single.legalName : "Grupo EcoPack Norte (consolidado)"
  const author = getPerson(doc.versions[0]?.uploadedBy ?? "luis")
  const published = doc.publishedAt ?? doc.versions[0]?.uploadedAt ?? "2026-01-01T00:00"
  const base: Pick<DocContent, "issuer" | "notes"> = {
    issuer: "González Solís · Servicios profesionales",
    notes: [`Preparado por ${author.firstName} ${author.lastName} (${author.title}). Publicado el ${formatDate(published.slice(0, 10), { day: "numeric", month: "long", year: "numeric" })}.`],
  }

  switch (doc.template) {
    case "estados_financieros": {
      const revenue = doc.companies.reduce((s, c) => s + monthRevenue(c, m), 0)
      const ytd = doc.companies.reduce((s, c) => s + Array.from({ length: m }, (_, i) => monthRevenue(c, i + 1)).reduce((a, b) => a + b, 0), 0)
      const margin = doc.companies.reduce((s, c) => s + metrics[c].grossMargin * monthRevenue(c, m), 0) / revenue
      const line = (r: number) => {
        const cost = r * (1 - margin)
        const gross = r - cost
        const opex = r * 0.118
        const op = gross - opex
        const fin = r * 0.009
        const pre = op - fin
        const tax = pre * 0.3
        return [r, cost, gross, opex, op, fin, pre, tax, pre - tax]
      }
      const mo = line(revenue)
      const ac = line(ytd)
      const labels = ["Ingresos", "Costo de ventas", "Utilidad bruta", "Gastos de operación", "Utilidad de operación", "Resultado integral de financiamiento", "Utilidad antes de impuestos", "ISR", "Utilidad neta"]
      const assets = ytd * 0.62
      return {
        ...base,
        title: "Estados financieros",
        subtitle: `${who} · ${periodText}`,
        meta: [
          ["Razón social", who],
          ["Periodo", `Del 1 al ${new Date(year, m, 0).getDate()} de ${MONTHS[m - 1]} de ${year}`],
          ["Base", "Normas de Información Financiera (NIF)"],
          ["Fuente", "ContaLink · cifras cerradas"],
        ],
        tables: [
          { heading: "Estado de resultados", columns: ["Concepto", "Del mes", "Acumulado"], rows: labels.map((l, i) => [l, money(mo[i]), money(ac[i])]) },
          {
            heading: "Balance general (resumen)",
            columns: ["Concepto", "Saldo", "% del total"],
            rows: [
              ["Activo circulante", money(assets * 0.58), pct(0.58)],
              ["Activo fijo neto", money(assets * 0.42), pct(0.42)],
              ["Pasivo a corto plazo", money(assets * 0.27), pct(0.27)],
              ["Pasivo a largo plazo", money(assets * 0.14), pct(0.14)],
              ["Capital contable", money(assets * 0.59), pct(0.59)],
            ],
            total: ["Total activo", money(assets), pct(1)],
          },
        ],
        notes: [`Margen bruto del mes: ${pct(margin)}.`, ...base.notes],
      }
    }
    case "balanza": {
      const c = doc.companies[0]
      const r = monthRevenue(c, m)
      const accounts: [string, string, number][] = [
        ["102-01", "Bancos nacionales", 0.42],
        ["105-01", "Clientes nacionales", 0.68],
        ["118-01", "IVA acreditable pagado", 0.09],
        ["115-01", "Inventario de producto terminado", 0.51],
        ["152-01", "Maquinaria y equipo", 1.9],
        ["201-01", "Proveedores nacionales", 0.47],
        ["208-01", "IVA trasladado cobrado", 0.12],
        ["216-01", "ISR por pagar", 0.05],
        ["301-01", "Capital social", 1.2],
        ["401-01", "Ventas y/o servicios gravados", 1],
        ["501-01", "Costo de venta", 0.7],
        ["601-01", "Gastos generales", 0.12],
      ]
      const rows = accounts.map(([code, name, f]) => {
        const ini = r * f * (2 + rnd(code + c + m))
        const car = r * f * (0.6 + rnd(code + "c" + m) * 0.4)
        const abo = r * f * (0.5 + rnd(code + "a" + m) * 0.4)
        return [code, name, money(ini), money(car), money(abo), money(ini + car - abo)]
      })
      return {
        ...base,
        title: "Balanza de comprobación",
        subtitle: `${who} · ${periodText}`,
        meta: [
          ["RFC", single?.rfc ?? ""],
          ["Periodo", periodText],
          ["Nivel", "Cuentas de mayor"],
          ["Fuente", "ContaLink"],
        ],
        tables: [{ heading: "Movimientos del periodo", columns: ["Cuenta", "Nombre", "Saldo inicial", "Cargos", "Abonos", "Saldo final"], rows }],
        notes: base.notes,
      }
    }
    case "declaracion": {
      const c = doc.companies[0]
      const r = monthRevenue(c, m)
      const isr = Math.round(r * metrics[c].grossMargin * 0.3 * 0.55)
      const iva = Math.round(r * 0.16 * 0.22)
      const ret = c === "servicios" ? Math.round(r * 0.06) : Math.round(r * 0.004)
      return {
        ...base,
        title: "Acuse de recibo · Declaración provisional o definitiva de impuestos federales",
        subtitle: `${who} · ${periodText}`,
        meta: [
          ["RFC", single?.rfc ?? ""],
          ["Ejercicio", String(year)],
          ["Periodo", MONTHS[m - 1]],
          ["Tipo de declaración", "Normal"],
          ["Número de operación", fakeOp(doc.id)],
          ["Fecha y hora de presentación", `${m === 12 ? 17 : 16}/${String(m + 1).padStart(2, "0")}/${year} 13:0${Math.floor(rnd(doc.id) * 9)}`],
          ["Línea de captura", `0326 ${fakeOp(doc.id + "l", 4)} ${fakeOp(doc.id + "m", 4)} ${fakeOp(doc.id + "n", 4)} 4${fakeOp(doc.id + "o", 3)}`],
        ],
        tables: [
          {
            heading: "Impuestos declarados",
            columns: ["Concepto", "Importe a cargo"],
            rows: [
              ["ISR personas morales (pago provisional)", money(isr)],
              ["IVA a cargo", money(iva)],
              ["ISR retenciones por salarios y asimilados", money(ret)],
            ],
            total: ["Total a pagar", money(isr + iva + ret)],
          },
        ],
        notes: ["Acuse simulado para la demostración; no es un documento emitido por el SAT.", ...base.notes],
      }
    }
    case "papel_trabajo": {
      const c = doc.companies[0]
      const cum = Array.from({ length: m }, (_, i) => monthRevenue(c, i + 1)).reduce((a, b) => a + b, 0)
      const cu = metrics[c].grossMargin * 0.48
      const util = cum * cu
      const prev = util * 0.3 * ((m - 1) / m)
      const ivaT = monthRevenue(c, m) * 0.16
      const ivaA = ivaT * 0.78
      return {
        ...base,
        title: "Papel de trabajo · Pagos provisionales",
        subtitle: `${who} · ${periodText}`,
        meta: [
          ["RFC", single?.rfc ?? ""],
          ["Periodo", periodText],
          ["Estado", "Aprobado por el cliente"],
          ["Fuente", "ContaLink · BFiskur"],
        ],
        tables: [
          {
            heading: "ISR",
            columns: ["Concepto", "Importe"],
            rows: [
              ["Ingresos nominales acumulados", money(cum)],
              ["Coeficiente de utilidad", cu.toFixed(4)],
              ["Utilidad fiscal estimada", money(util)],
              ["ISR causado (30 %)", money(util * 0.3)],
              ["Pagos provisionales anteriores", money(prev)],
            ],
            total: ["ISR a pagar del periodo", money(util * 0.3 - prev)],
          },
          {
            heading: "IVA",
            columns: ["Concepto", "Importe"],
            rows: [
              ["IVA trasladado cobrado", money(ivaT)],
              ["IVA acreditable pagado", money(ivaA)],
            ],
            total: ["IVA a cargo", money(ivaT - ivaA)],
          },
        ],
        notes: base.notes,
      }
    }
    case "diot": {
      const c = doc.companies[0]
      const providers = [
        ["Resinas del Bajío, S.A. de C.V.", "RBA0904218K3"],
        ["Cartonera Regia, S.A. de C.V.", "CRE1107153P1"],
        ["Transportes del Noreste, S.A. de C.V.", "TNO0802195M7"],
        ["Energía Industrial NL, S.A. de C.V.", "EIN1305097Q2"],
        ["Tintas y Recubrimientos Monterrey, S.A.", "TRM1010277H9"],
      ]
      const r = monthRevenue(c, m)
      const rows = providers.map(([n, rfc], i) => {
        const v = r * (0.18 - i * 0.025) * (0.8 + rnd(n + m) * 0.4)
        return [rfc, n, money(v), money(v * 0.16)]
      })
      return {
        ...base,
        title: "Acuse · Declaración informativa de operaciones con terceros (DIOT)",
        subtitle: `${who} · ${periodText}`,
        meta: [
          ["RFC", single?.rfc ?? ""],
          ["Periodo", periodText],
          ["Número de operación", fakeOp(doc.id)],
          ["Proveedores informados", String(38 + Math.floor(rnd(doc.id) * 30))],
        ],
        tables: [{ heading: "Principales proveedores informados", columns: ["RFC", "Proveedor", "Actos o actividades al 16 %", "IVA pagado"], rows }],
        notes: ["Acuse simulado para la demostración; no es un documento emitido por el SAT.", ...base.notes],
      }
    }
    case "contabilidad_electronica":
      return {
        ...base,
        title: "Acuse de recepción · Contabilidad electrónica",
        subtitle: `${who} · Balanza de ${periodText}`,
        meta: [
          ["RFC", single?.rfc ?? ""],
          ["Documento enviado", "Balanza de comprobación (XML)"],
          ["Tipo de envío", "Normal"],
          ["Periodo", periodText],
          ["Número de operación", fakeOp(doc.id)],
          ["Estado", "Aceptado"],
        ],
        tables: [],
        notes: ["Acuse simulado para la demostración; no es un documento emitido por el SAT.", ...base.notes],
      }
    case "opinion":
      return {
        ...base,
        title: "Opinión del cumplimiento de obligaciones fiscales",
        subtitle: `Grupo EcoPack Norte · ${periodText}`,
        meta: [
          ["Sentido", "Positivo para las cinco razones sociales"],
          ["Vigencia", "30 días naturales a partir de su emisión"],
        ],
        tables: [{ heading: "Resultado por razón social", columns: ["Razón social", "RFC", "Sentido"], rows: cs.map((c) => [c.legalName, c.rfc, "Positivo"]) }],
        notes: ["Documento simulado para la demostración.", ...base.notes],
      }
    case "factura": {
      const total = doc.amount ?? 0
      const sub = total / 1.16
      const credit = total < 0
      return {
        ...base,
        title: credit ? `Nota de crédito ${doc.folio}` : `Factura ${doc.folio}`,
        subtitle: `${who} · ${periodText}`,
        meta: [
          ["Emisor", "González Solís · RFC de ejemplo GSO000101AA0"],
          ["Receptor", `${who} · RFC ${single?.rfc ?? ""}`],
          ["Folio fiscal (UUID)", `${fakeOp(doc.id, 8)}-${fakeOp(doc.id + "a", 4)}-4${fakeOp(doc.id + "b", 3)}-A${fakeOp(doc.id + "c", 3)}-${fakeOp(doc.id + "d", 12)}`],
          ["Fecha de emisión", formatDate(published.slice(0, 10), { day: "numeric", month: "long", year: "numeric" })],
          ["Uso del CFDI", "G03 · Gastos en general"],
          ["Método de pago", "PPD · Pago en parcialidades o diferido"],
        ],
        tables: [
          {
            heading: "Conceptos",
            columns: ["Descripción", "Importe"],
            rows: credit
              ? [["Bonificación: revisión de precios de transferencia no contratada", money(sub)]]
              : doc.name.includes("escisión")
                ? [["Anticipo 1 de 3: proyecto de escisión de EcoPack Inmuebles", money(sub)]]
                : [
                    [`Servicios de contabilidad mensual · ${MONTHS[m - 1]} ${year}`, money(sub * 0.62)],
                    [`Cumplimiento fiscal mensual · ${MONTHS[m - 1]} ${year}`, money(sub * 0.38)],
                  ],
            total: ["Total (IVA 16 % incluido)", money(total)],
          },
        ],
        notes: [`Subtotal ${money(sub)} · IVA ${money(total - sub)}.`, "CFDI simulado para la demostración; no tiene validez fiscal.", ...base.notes],
      }
    }
    case "reporte_ejecutivo": {
      const rows = (["manufactura", "comercial", "logistica", "inmuebles", "servicios"] as CompanyId[]).map((c) => {
        const r = monthRevenue(c, m)
        return [companies.find((x) => x.id === c)!.name, money(r), pct(metrics[c].grossMargin), m > 1 ? `${((SEASON[m - 1] / SEASON[m - 2] - 1) * 100).toFixed(1)} %` : "—"]
      })
      return {
        ...base,
        title: "Reporte ejecutivo mensual",
        subtitle: `Grupo EcoPack Norte · ${periodText}`,
        meta: [
          ["Preparado para", "Dirección General y Dirección de Finanzas"],
          ["Presentado en", `Reunión mensual de resultados de ${MONTHS[m - 1]}`],
        ],
        tables: [{ heading: "Resultados por razón social", columns: ["Razón social", "Ingresos del mes", "Margen bruto", "Variación vs. mes anterior"], rows }],
        notes: ["Incluye avance de cumplimiento, pendientes críticos y recomendaciones de GS.", ...base.notes],
      }
    }
    case "dictamen":
      return {
        ...base,
        title: "Informe del auditor independiente y estados financieros dictaminados",
        subtitle: `${who} · Ejercicio 2025`,
        meta: [
          ["Opinión", "Sin salvedades"],
          ["Socio a cargo", "C.P.C. Ricardo Montemayor"],
          ["Normas", "Normas Internacionales de Auditoría"],
        ],
        tables: [],
        notes: ["En nuestra opinión, los estados financieros presentan razonablemente, en todos los aspectos importantes, la situación financiera de la entidad al 31 de diciembre de 2025.", "Documento simulado para la demostración.", ...base.notes],
      }
    case "anual":
      return {
        ...base,
        title: "Acuse · Declaración anual de personas morales",
        subtitle: `${who} · Ejercicio 2025`,
        meta: [
          ["RFC", single?.rfc ?? ""],
          ["Ejercicio", "2025"],
          ["Tipo de declaración", "Normal"],
          ["Número de operación", fakeOp(doc.id)],
        ],
        tables: [],
        notes: ["Acuse simulado para la demostración; no es un documento emitido por el SAT.", ...base.notes],
      }
    default:
      return {
        ...base,
        title: doc.name,
        subtitle: `${who} · ${doc.period}`,
        meta: [
          ["Tipo", doc.docType],
          ["Periodo", doc.period],
        ],
        tables: [],
        notes: [doc.versions.at(-1)?.note ?? "Entregable de GS.", ...base.notes],
      }
  }
}

/** Columnas de texto (alineadas a la izquierda) frente a columnas de importes (a la derecha). */
export function textColumns(table: DocTable): boolean[] {
  return table.columns.map((_, i) => i === 0 || table.rows.some((r) => /[a-záéíóúñ]{3,}/i.test(r[i] ?? "")))
}
