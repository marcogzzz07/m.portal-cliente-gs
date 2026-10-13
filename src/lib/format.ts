const LOCALE = "es-MX"

/** Convierte "AAAA-MM-DD" en Date local (sin desfase de zona horaria). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Fecha corta: "25 sep" (o con las opciones que se indiquen). */
export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat(LOCALE, options).format(parseDate(iso)).replace(".", "")
}

/** Fecha larga: "viernes, 25 de septiembre de 2026". */
export function formatLongDate(iso: string) {
  return formatDate(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

/** Hoy en formato "AAAA-MM-DD". */
export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Moneda en pesos: "$12,500.00" (o sin decimales con decimals = 0). */
export function formatCurrency(value: number, decimals = 2) {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: "MXN", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

/** Número con separadores: "1,234,567". */
export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

/** Porcentaje: 0.125 → "12.5 %". */
export function formatPercent(ratio: number, decimals = 1) {
  return `${formatNumber(ratio * 100, decimals)} %`
}

/**
 * Montos grandes abreviados: 1 250 000 → "$1.3 M", 45 000 → "$45 mil".
 * Se arma a mano porque `notation: "compact"` escribe distinto en Node y en el navegador.
 */
export function formatCompactCurrency(value: number) {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1_000_000) return `${sign}$${formatNumber(abs / 1_000_000, 1)} M`
  if (abs >= 1_000) return `${sign}$${formatNumber(abs / 1_000, 0)} mil`
  return `${sign}$${formatNumber(abs, 0)}`
}

export function getInitials(firstName: string, lastName = "") {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

/* ─── Tiempo simulado del prototipo ─────────────────────────────────────── */

/** "Hoy" del prototipo. Todas las fechas de los datos ficticios se calculan contra este día. */
export const DEMO_TODAY = "2026-10-12"

/** Momento actual dentro del prototipo: el día simulado con la hora real del reloj. */
export function demoNowIso() {
  const d = new Date()
  // Los datos semilla llegan hasta las 09:00 del día simulado; antes de esa hora se usa 09:00.
  const early = d.getHours() < 9
  const h = early ? 9 : d.getHours()
  const m = early ? 0 : d.getMinutes()
  return `${DEMO_TODAY}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function parseDateTime(iso: string): Date {
  const [date, time = "00:00"] = iso.split("T")
  const [h, m] = time.split(":").map(Number)
  const d = parseDate(date)
  d.setHours(h, m)
  return d
}

/** Días entre el día simulado y una fecha ("AAAA-MM-DD"). Negativo = ya pasó. */
export function daysFromToday(iso: string) {
  const ms = parseDate(iso.slice(0, 10)).getTime() - parseDate(DEMO_TODAY).getTime()
  return Math.round(ms / 86_400_000)
}

/** "Vence hoy", "Vence mañana", "Vence en 5 días", "Venció hace 3 días". */
export function dueLabel(iso: string, verb = "Vence") {
  const days = daysFromToday(iso)
  if (days === 0) return `${verb} hoy`
  if (days === 1) return `${verb} mañana`
  if (days > 1) return `${verb} en ${days} días`
  if (days === -1) return verb === "Vence" ? "Venció ayer" : `${verb} ayer`
  return verb === "Vence" ? `Venció hace ${-days} días` : `${verb} hace ${-days} días`
}

/** "12 oct, 08:10". */
export function formatDateTime(iso: string) {
  const [date, time] = iso.split("T")
  return time ? `${formatDate(date)}, ${time}` : formatDate(date)
}

/** "Hace 10 min", "Hace 3 h", "Ayer", "5 oct". Relativo al momento simulado. */
export function formatRelative(iso: string) {
  const now = parseDateTime(demoNowIso()).getTime()
  const at = parseDateTime(iso).getTime()
  const minutes = Math.round((now - at) / 60_000)
  if (minutes < 1) return "Justo ahora"
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24 && iso.slice(0, 10) === DEMO_TODAY) return `Hace ${hours} h`
  const days = -daysFromToday(iso)
  if (days === 1) return `Ayer, ${iso.split("T")[1] ?? ""}`.replace(/, $/, "")
  if (days < 7) return `Hace ${days} días`
  return formatDate(iso.slice(0, 10))
}

export function fullName(p: { firstName: string; lastName: string }) {
  return `${p.firstName} ${p.lastName}`
}
