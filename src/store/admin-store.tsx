"use client"

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react"

import { seedAudit, seedContracts, seedInvoices, seedOnboarding, seedUsers } from "@/data/admin"
import { getPerson } from "@/data/organization"
import { daysFromToday, demoNowIso, formatCurrency } from "@/lib/format"
import type { AuditEvent, ClientUser, Contract, DocumentItem, Invoice, InvoiceStatus, OnboardingStatus, OnboardingStep, Payment, PaymentMethod } from "@/lib/types"
import { usePortal } from "./portal-store"

const STORAGE_KEY = "gs-portal-clientes-admin-v1"

interface AdminState {
  contracts: Contract[]
  invoices: Invoice[]
  users: ClientUser[]
  audit: AuditEvent[]
  onboarding: OnboardingStep[]
  onboardingData: { fiscal?: Record<string, string>; users?: string[]; files?: Record<string, string> }
}

function initial(): AdminState {
  return { contracts: seedContracts, invoices: seedInvoices, users: seedUsers, audit: seedAudit, onboarding: seedOnboarding, onboardingData: { fiscal: { regimen: "601 · General de Ley Personas Morales", cp: "66600" } } }
}

type Action =
  | { type: "hydrate"; state: AdminState }
  | { type: "reset" }
  | { type: "patchContract"; id: string; patch: Partial<Contract>; log?: { text: string; by?: string } }
  | { type: "addInvoice"; invoice: Invoice }
  | { type: "patchInvoice"; id: string; patch: Partial<Invoice> }
  | { type: "addPayment"; id: string; payment: Payment }
  | { type: "patchPayment"; id: string; paymentId: string; patch: Partial<Payment> }
  | { type: "addUser"; user: ClientUser }
  | { type: "patchUser"; id: string; patch: Partial<ClientUser> }
  | { type: "audit"; event: AuditEvent }
  | { type: "setStep"; id: string; status: OnboardingStatus; note?: string }
  | { type: "onboardingData"; patch: AdminState["onboardingData"] }

let seq = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`

function reducer(state: AdminState, a: Action): AdminState {
  const now = demoNowIso()
  switch (a.type) {
    case "hydrate":
      return a.state
    case "reset":
      return initial()
    case "patchContract":
      return {
        ...state,
        contracts: state.contracts.map((c) => (c.id === a.id ? { ...c, ...a.patch, history: a.log ? [...c.history, { at: now, text: a.log.text, by: a.log.by }] : c.history } : c)),
      }
    case "addInvoice":
      return { ...state, invoices: [a.invoice, ...state.invoices] }
    case "patchInvoice":
      return { ...state, invoices: state.invoices.map((i) => (i.id === a.id ? { ...i, ...a.patch } : i)) }
    case "addPayment":
      return { ...state, invoices: state.invoices.map((i) => (i.id === a.id ? { ...i, payments: [...i.payments, a.payment] } : i)) }
    case "patchPayment":
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === a.id ? { ...i, payments: i.payments.map((p) => (p.id === a.paymentId ? { ...p, ...a.patch } : p)) } : i)),
      }
    case "addUser":
      return { ...state, users: [...state.users, a.user] }
    case "patchUser":
      return { ...state, users: state.users.map((u) => (u.id === a.id ? { ...u, ...a.patch } : u)) }
    case "audit":
      return { ...state, audit: [a.event, ...state.audit] }
    case "setStep":
      return {
        ...state,
        onboarding: state.onboarding.map((s) =>
          s.id === a.id ? { ...s, status: a.status, note: a.note ?? (a.status === "changes_required" ? s.note : undefined), completedAt: a.status === "completed" || a.status === "approved" ? now : s.completedAt } : s
        ),
      }
    case "onboardingData":
      return { ...state, onboardingData: { ...state.onboardingData, ...a.patch } }
  }
}

/* ─── Estados calculados ─────────────────────────────────────────────────── */

export function paidAmount(inv: Invoice) {
  return inv.payments.filter((p) => p.status === "applied").reduce((s, p) => s + p.amount, 0) + (inv.creditNote?.amount ?? 0)
}

export function balanceOf(inv: Invoice) {
  return inv.voided ? 0 : Math.max(0, inv.total - paidAmount(inv))
}

/** Estado de la factura según Odoo: el portal nunca marca una factura como pagada por su cuenta. */
export function invoiceStatus(inv: Invoice): InvoiceStatus {
  if (inv.voided) return "voided"
  if (balanceOf(inv) === 0) return "paid"
  if (inv.dispute?.status === "abierta") return "disputed"
  if (paidAmount(inv) > 0) return "partially_paid"
  const d = daysFromToday(inv.dueDate)
  if (d < 0) return "overdue"
  if (d <= 7) return "due_soon"
  return "issued"
}

interface AdminValue {
  state: AdminState
  viewContract: (id: string) => void
  approveContract: (id: string) => void
  requestContractChange: (id: string, text: string) => void
  declineContract: (id: string, reason: string) => void
  signContract: (id: string, signature: string) => void
  payInvoice: (id: string, input: { amount: number; method: PaymentMethod; receipt?: string; fail?: boolean }) => string
  disputeInvoice: (id: string, reason: string, comment: string) => void
  inviteUser: (user: Omit<ClientUser, "id" | "status" | "mfa" | "invitedAt" | "invitedBy" | "expiresAt">) => void
  updateUser: (id: string, patch: Partial<ClientUser>, auditText?: string) => void
  activateInvitation: (id: string, mfa: "app" | "sms") => void
  setStep: (id: string, status: OnboardingStatus, note?: string) => void
  saveOnboardingData: (patch: AdminState["onboardingData"]) => void
  submitStep: (id: string) => void
  reset: () => void
}

const AdminContext = createContext<AdminValue | null>(null)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const portal = usePortal()
  const [state, dispatch] = useReducer(reducer, undefined, initial)
  const [hydrated, setHydrated] = useState(false)
  const ref = useRef(state)
  const portalRef = useRef(portal)
  useEffect(() => {
    ref.current = state
    portalRef.current = portal
  })

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) dispatch({ type: "hydrate", state: { ...initial(), ...JSON.parse(saved) } })
    } catch {
      // Sin almacenamiento: estado inicial.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // La demo funciona sin persistencia.
    }
  }, [state, hydrated])

  const value = useMemo<AdminValue>(() => {
    const me = portal.persona.personId
    const meName = () => {
      const p = getPerson(portalRef.current.persona.personId)
      return `${p.firstName} ${p.lastName}`
    }
    const auto = () => portalRef.current.state.demo.autoReplies
    const later = (ms: number, fn: () => void) => window.setTimeout(fn, ms)
    const audit = (action: string, detail: string) => dispatch({ type: "audit", event: { id: uid("A"), at: demoNowIso(), actor: meName(), action, detail } })

    /** Al completar la firma: documento firmado, anticipo facturado y onboarding habilitado. */
    function completeContract(c: Contract) {
      const at = demoNowIso()
      const docId = `DOC-${c.id}-firmado`
      const doc: DocumentItem = {
        id: docId,
        name: c.id === "PRO-2027" ? "Contrato de prestación de servicios 2027" : c.title,
        companies: ["manufactura", "comercial", "logistica", "inmuebles", "servicios"],
        service: "contabilidad",
        period: "2027",
        periodKey: "2026-10",
        docType: "Contrato",
        template: "generico",
        direction: "gs",
        status: "completed",
        signed: { at, by: c.signers.map((s) => s.personId), provider: "Firma electrónica (DocuSign simulado)" },
        formats: ["pdf"],
        versions: [{ version: 1, fileName: `${c.id}_firmado.pdf`, size: "1.1 MB", uploadedBy: c.ownerId, uploadedAt: at, note: "Incluye certificado de firma." }],
        publishedAt: at,
        downloads: [],
        visibility: "grupo",
      }
      portalRef.current.addDocument(doc)
      dispatch({ type: "patchContract", id: c.id, patch: { status: "completed", documentId: docId }, log: { text: "Firma completada. Documento final y certificado guardados.", by: c.ownerId } })
      portalRef.current.notify("firma", "Propuesta firmada por todos", `${c.title}. El documento final está en Documentos › Firmados.`, `/contratos/${c.id}`)
      if (c.advance) {
        const total = Math.round(c.advance * 1.16)
        const invDoc: DocumentItem = {
          id: "DOC-FAC-A-4830",
          name: "Factura A-4830 · Anticipo alta de EcoPack Desarrollos",
          companies: ["inmuebles"],
          service: "facturacion",
          period: "Octubre 2026",
          periodKey: "2026-10",
          docType: "Factura de GS (CFDI)",
          template: "factura",
          direction: "gs",
          status: "completed",
          formats: ["pdf", "xml"],
          versions: [{ version: 1, fileName: "GS_A-4830.pdf", size: "112 KB", uploadedBy: "diana", uploadedAt: at }],
          publishedAt: at,
          downloads: [],
          visibility: "restringido",
          folio: "A-4830",
          amount: total,
        }
        portalRef.current.addDocument(invDoc)
        dispatch({
          type: "addInvoice",
          invoice: { id: "A-4830", folio: "A-4830", documentId: invDoc.id, company: "inmuebles", concept: "Anticipo · Alta de EcoPack Desarrollos", period: "Octubre 2026", issuedAt: at, dueDate: "2026-10-19", total, payments: [] },
        })
        portalRef.current.notify("factura", "Factura A-4830 emitida", `Anticipo del alta de EcoPack Desarrollos · ${formatCurrency(total)}`, "/facturacion/A-4830")
        dispatch({ type: "setStep", id: "OB-4", status: "completed" })
        dispatch({ type: "setStep", id: "OB-8", status: "available" })
      }
      portalRef.current.completeAction("PEN-114", "Propuesta 2027 firmada")
    }

    function maybeActivate() {
      later(300, () => {
        const steps = ref.current.onboarding
        const done = steps.filter((s) => s.n <= 9).every((s) => s.status === "completed" || s.status === "approved")
        if (done && steps.find((s) => s.id === "OB-10")?.status === "locked") {
          dispatch({ type: "setStep", id: "OB-10", status: "in_progress" })
          later(3000, () => {
            dispatch({ type: "setStep", id: "OB-10", status: "completed" })
            portalRef.current.notify("entregable", "EcoPack Desarrollos está activa", "GS activó Contabilidad e Impuestos para la nueva empresa.", "/onboarding")
          })
        }
      })
    }

    return {
      state,
      viewContract: (id) => {
        const c = ref.current.contracts.find((x) => x.id === id)
        if (c?.status === "sent") dispatch({ type: "patchContract", id, patch: { status: "viewed" }, log: { text: `${meName()} abrió la propuesta`, by: me } })
      },
      approveContract: (id) => {
        dispatch({ type: "patchContract", id, patch: { approvals: [...(ref.current.contracts.find((c) => c.id === id)?.approvals ?? []), { personId: me, at: demoNowIso() }] }, log: { text: `${meName()} aprobó el contenido; queda lista para firma`, by: me } })
        audit("Aprobó una propuesta", id)
        portalRef.current.notify("firma", "Propuesta lista para firma", "Roberto Elizondo y Jorge Salinas ya pueden firmar.", `/contratos/${id}`)
      },
      requestContractChange: (id, text) => {
        const c = ref.current.contracts.find((x) => x.id === id)!
        let convId = c.conversationId
        if (!convId) convId = portalRef.current.createConversation({ subject: c.title, context: { type: "contrato", refId: c.id, label: c.title }, companies: ["manufactura", "comercial", "logistica", "inmuebles", "servicios"], service: "contabilidad", gsOwnerId: c.ownerId }, text)
        else portalRef.current.sendMessage(convId, text)
        dispatch({ type: "patchContract", id, patch: { status: "changes_requested", changeRequest: { by: me, at: demoNowIso(), text }, conversationId: convId }, log: { text: `${meName()} solicitó cambios`, by: me } })
        audit("Solicitó cambios a una propuesta", `${id}: ${text}`)
      },
      declineContract: (id, reason) => {
        dispatch({ type: "patchContract", id, patch: { status: "declined", declineReason: reason, signers: ref.current.contracts.find((c) => c.id === id)!.signers.map((s) => (s.personId === me ? { ...s, status: "rechazado" as const } : s)) }, log: { text: `${meName()} rechazó la propuesta`, by: me } })
        audit("Rechazó una propuesta", `${id}: ${reason}`)
      },
      signContract: (id) => {
        const c = ref.current.contracts.find((x) => x.id === id)!
        const at = demoNowIso()
        const signers = c.signers.map((s) => (s.personId === me ? { ...s, status: "firmado" as const, signedAt: at } : s))
        dispatch({ type: "patchContract", id, patch: { signers, status: "partially_signed" }, log: { text: `${meName()} firmó`, by: me } })
        audit("Firmó un documento", c.title)
        // Simulación: los demás firmantes y la contrafirma de GS llegan en unos segundos.
        if (auto()) {
          later(3500, () => {
            const current = ref.current.contracts.find((x) => x.id === id)!
            const t = demoNowIso()
            const all = current.signers.map((s) => (s.status === "pendiente" ? { ...s, status: "firmado" as const, signedAt: t } : s))
            const others = current.signers.filter((s) => s.status === "pendiente").map((s) => getPerson(s.personId).firstName)
            dispatch({ type: "patchContract", id, patch: { signers: all }, log: { text: `Firmaron: ${others.join(", ")}`, by: current.ownerId } })
            completeContract({ ...current, signers: all })
          })
        }
      },
      payInvoice: (id, { amount, method, receipt, fail }) => {
        const payment: Payment = { id: uid("PAG"), amount, method, status: "initiated", at: demoNowIso(), by: me, reference: method === "transferencia" ? `SPEI ${Math.floor(Math.random() * 9e6 + 1e6)}` : `AUT-${Math.floor(Math.random() * 9e5 + 1e5)}`, receipt }
        dispatch({ type: "addPayment", id, payment })
        audit("Inició un pago", `${id} · ${formatCurrency(amount)} · ${method}`)
        later(1200, () => dispatch({ type: "patchPayment", id, paymentId: payment.id, patch: { status: fail ? "failed" : method === "transferencia" ? "pending_validation" : "processing", failureReason: fail ? "El banco emisor rechazó la operación (fondos insuficientes)." : undefined } }))
        if (fail) return payment.id
        later(method === "transferencia" ? 6000 : 3500, () => {
          dispatch({ type: "patchPayment", id, paymentId: payment.id, patch: { status: "applied" } })
          portalRef.current.notify("factura", `Pago aplicado a ${id}`, `${formatCurrency(amount)} · confirmado por Odoo`, `/facturacion/${id}`)
          if (id === "A-4830") {
            dispatch({ type: "setStep", id: "OB-8", status: "completed" })
            maybeActivate()
          }
          if (ref.current.invoices.find((i) => i.id === id)?.folio === "A-4821") portalRef.current.completeAction("PEN-108", "Pago aplicado en Odoo")
        })
        return payment.id
      },
      disputeInvoice: (id, reason, comment) => {
        const inv = ref.current.invoices.find((i) => i.id === id)!
        const convId = portalRef.current.createConversation(
          { subject: `Aclaración de la factura ${inv.folio}`, context: { type: "factura", refId: inv.id, label: `Factura ${inv.folio} · ${inv.concept}` }, companies: [inv.company], service: "facturacion", gsOwnerId: "diana" },
          `${reason}. ${comment}`
        )
        dispatch({ type: "patchInvoice", id, patch: { dispute: { reason, comment, openedAt: demoNowIso(), openedBy: me, ownerId: "diana", expectedBy: "2026-10-14", conversationId: convId, status: "abierta" } } })
        audit("Abrió una aclaración", `${inv.folio}: ${reason}`)
      },
      inviteUser: (input) => {
        const user: ClientUser = { ...input, id: uid("U"), status: "invitado", mfa: "pendiente", invitedAt: demoNowIso(), invitedBy: me, expiresAt: "2026-10-19" }
        dispatch({ type: "addUser", user })
        audit("Invitó a un usuario", `${user.firstName} ${user.lastName} · ${user.email}`)
      },
      updateUser: (id, patch, auditText) => {
        dispatch({ type: "patchUser", id, patch })
        if (auditText) {
          const u = ref.current.users.find((x) => x.id === id)
          audit(auditText, u ? `${u.firstName} ${u.lastName}` : id)
        }
      },
      activateInvitation: (id, mfa) => {
        dispatch({ type: "patchUser", id, patch: { status: "activo", mfa, lastAccess: demoNowIso() } })
        dispatch({ type: "audit", event: { id: uid("A"), at: demoNowIso(), actor: "Carmen Villarreal", action: "Activó su acceso", detail: `MFA por ${mfa === "app" ? "app autenticadora" : "SMS"}` } })
        portalRef.current.notify("seguridad", "Carmen Villarreal activó su acceso", "Configuró MFA y aceptó los avisos.", "/usuarios")
      },
      setStep: (id, status, note) => {
        dispatch({ type: "setStep", id, status, note })
        if (status === "completed" || status === "approved") maybeActivate()
      },
      saveOnboardingData: (patch) => dispatch({ type: "onboardingData", patch }),
      submitStep: (id) => {
        dispatch({ type: "setStep", id, status: "submitted" })
        if (!auto()) return
        later(1500, () => dispatch({ type: "setStep", id, status: "under_review" }))
        later(4500, () => {
          dispatch({ type: "setStep", id, status: "approved" })
          portalRef.current.notify("documento_revisado", "GS aprobó un paso de la incorporación", ref.current.onboarding.find((s) => s.id === id)?.title ?? "", "/onboarding")
          maybeActivate()
        })
      },
      reset: () => dispatch({ type: "reset" }),
    }
  }, [state, portal.persona.personId])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error("useAdmin debe usarse dentro de AdminProvider")
  return ctx
}

