import { documentContent, textColumns, type DocContent } from "./doc-content"
import type { DocumentItem, FileFormat } from "./types"

/**
 * Descargas reales de los entregables ficticios: PDF (generado a mano, sin librerías),
 * CSV para Excel y XML. Todo se arma en el navegador; nada sale a un servidor.
 */

/** Convierte a Latin-1 (WinAnsi) para la fuente Helvetica estándar del PDF. */
function latin1(text: string) {
  return text
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/·/g, "\xB7")
    .replace(/[^\x00-\xFF]/g, "")
}

function esc(text: string) {
  return latin1(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

/** Ancho aproximado de Helvetica (para alinear importes a la derecha). */
function textWidth(text: string, size: number) {
  return latin1(text).length * size * 0.5
}

interface Op {
  text: string
  x: number
  size: number
  bold?: boolean
  right?: boolean
  gray?: boolean
}

function buildPdf(content: DocContent): Blob {
  const pages: string[][] = [[]]
  let y = 780
  const W = 595
  const M = 50

  const newPage = () => {
    pages.push([])
    y = 780
  }
  const line = (ops: Op[], lh = 16) => {
    if (y < 70) newPage()
    for (const o of ops) {
      const x = o.right ? o.x - textWidth(o.text, o.size) : o.x
      pages.at(-1)!.push(`${o.gray ? "0.45 0.45 0.45 rg" : "0.12 0.12 0.14 rg"} BT /${o.bold ? "F2" : "F1"} ${o.size} Tf ${x.toFixed(1)} ${y} Td (${esc(o.text)}) Tj ET`)
    }
    y -= lh
  }
  const rule = (color = "0.85 0.85 0.87") => {
    pages.at(-1)!.push(`${color} RG 0.6 w ${M} ${y + 8} m ${W - M} ${y + 8} l S`)
  }
  const wrap = (text: string, size: number, width: number) => {
    const words = text.split(" ")
    const out: string[] = []
    let cur = ""
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w
      if (textWidth(next, size) > width && cur) {
        out.push(cur)
        cur = w
      } else cur = next
    }
    if (cur) out.push(cur)
    return out
  }

  // Encabezado
  pages[0].push(`0.725 0.176 0.196 rg ${M} 792 6 26 re f`)
  line([{ text: content.issuer, x: M + 14, size: 9, gray: true }], 18)
  for (const t of wrap(content.title, 16, W - 2 * M - 14)) line([{ text: t, x: M + 14, size: 16, bold: true }], 20)
  line([{ text: content.subtitle, x: M + 14, size: 10, gray: true }], 26)

  for (const [k, v] of content.meta) {
    const lines = wrap(v, 9.5, W - 2 * M - 170)
    line([{ text: k, x: M, size: 9, gray: true }, { text: lines[0] ?? "", x: M + 170, size: 9.5 }], 14)
    for (const extra of lines.slice(1)) line([{ text: extra, x: M + 170, size: 9.5 }], 14)
  }
  y -= 10

  for (const table of content.tables) {
    line([{ text: table.heading, x: M, size: 11.5, bold: true }], 20)
    const n = table.columns.length
    const isText = textColumns(table)
    // Ancho de cada columna proporcional a su contenido más largo.
    const weights = table.columns.map((col, i) => {
      const longest = Math.max(col.length, ...table.rows.map((r) => (r[i] ?? "").length), ...(table.total ? [table.total[i] ?? ""] : []).map((t) => t.length))
      return Math.min(isText[i] ? 46 : 18, Math.max(isText[i] ? 8 : 11, longest))
    })
    const sum = weights.reduce((a, b) => a + b, 0)
    const widths = weights.map((w) => ((W - 2 * M) * w) / sum)
    const start = (i: number) => M + widths.slice(0, i).reduce((a, b) => a + b, 0)
    const row = (cells: string[], bold = false, gray = false) =>
      line(
        cells.map((c, i) => {
          const max = widths[i] - 8
          let text = c
          while (textWidth(text, 9) > max && text.length > 4) text = `${text.slice(0, -4)}...`
          return isText[i] ? { text, x: start(i), size: 9, bold, gray } : { text, x: start(i) + widths[i], size: 9, bold, gray, right: true }
        }),
        15
      )
    row(table.columns, true, true)
    rule()
    for (const r of table.rows) row(r)
    if (table.total) {
      rule("0.3 0.3 0.32")
      row(table.total.length === n ? table.total : [table.total[0], ...Array(n - table.total.length).fill(""), ...table.total.slice(1)], true)
    }
    y -= 14
  }

  for (const note of content.notes) for (const t of wrap(note, 8.5, W - 2 * M)) line([{ text: t, x: M, size: 8.5, gray: true }], 12)

  // Pie en cada página
  pages.forEach((p, i) => {
    p.push(`0.55 0.55 0.57 rg BT /F1 7.5 Tf ${M} 36 Td (${esc("DOCUMENTO FICTICIO · Prototipo del Portal de Clientes GS · Datos de demostración")}) Tj ET`)
    p.push(`0.55 0.55 0.57 rg BT /F1 7.5 Tf ${W - M - 40} 36 Td (${esc(`Página ${i + 1} de ${pages.length}`)}) Tj ET`)
  })

  // Ensamble del PDF
  const objects: string[] = []
  const add = (body: string) => {
    objects.push(body)
    return objects.length
  }
  const catalog = add("") // se completa al final
  const pagesObj = add("")
  const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
  const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
  const pageIds: number[] = []
  for (const p of pages) {
    const stream = p.join("\n")
    const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    pageIds.push(add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} 842] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${contentId} 0 R >>`))
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`
  objects[pagesObj - 1] = `<< /Type /Pages /Kids [${pageIds.map((i) => `${i} 0 R`).join(" ")}] /Count ${pageIds.length} >>`

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`

  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  return new Blob([bytes], { type: "application/pdf" })
}

function buildCsv(content: DocContent): Blob {
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines: string[] = [q(content.title), q(content.subtitle), ""]
  for (const [k, v] of content.meta) lines.push([q(k), q(v)].join(","))
  for (const t of content.tables) {
    lines.push("", q(t.heading), t.columns.map(q).join(","))
    for (const r of t.rows) lines.push(r.map(q).join(","))
    if (t.total) lines.push(t.total.map(q).join(","))
  }
  lines.push("", q("Documento ficticio · Prototipo del Portal de Clientes GS"))
  return new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" })
}

function buildXml(doc: DocumentItem, content: DocContent): Blob {
  const x = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")
  const meta = content.meta.map(([k, v]) => `    <Dato nombre="${x(k)}" valor="${x(v)}"/>`).join("\n")
  const rows = content.tables
    .flatMap((t) => t.rows.map((r) => `    <Concepto ${t.columns.map((c, i) => `c${i}="${x(r[i] ?? "")}"`).join(" ")}/>`))
    .join("\n")
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Documento ficticio para demostración. No es un CFDI válido. -->\n<DocumentoDemo id="${doc.id}" titulo="${x(content.title)}" periodo="${x(doc.period)}">\n  <Datos>\n${meta}\n  </Datos>\n  <Conceptos>\n${rows}\n  </Conceptos>\n</DocumentoDemo>\n`
  return new Blob([xml], { type: "application/xml" })
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Archivo del documento en el formato pedido. Excel se entrega como CSV, que Excel abre directamente. */
export function documentFile(doc: DocumentItem, format: FileFormat): { blob: Blob; name: string } {
  const content = documentContent(doc)
  const baseName = (doc.versions.at(-1)?.fileName ?? doc.name).replace(/\.[^.]+$/, "")
  switch (format) {
    case "xlsx":
      return { blob: buildCsv(content), name: `${baseName}.csv` }
    case "xml":
      return { blob: buildXml(doc, content), name: `${baseName}.xml` }
    default:
      // PDF también para PowerPoint, Word y ZIP: en el prototipo se entrega la versión imprimible.
      return { blob: buildPdf(content), name: `${baseName}.pdf` }
  }
}

export function downloadDocument(doc: DocumentItem, format: FileFormat) {
  const { blob, name } = documentFile(doc, format)
  save(blob, name)
}

/** Descarga en PDF de un contenido ya armado (propuestas, contratos). */
export function downloadContent(content: DocContent, name: string) {
  save(buildPdf(content), `${name}.pdf`)
}
