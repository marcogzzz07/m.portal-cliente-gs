"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { toast } from "sonner"

import { seedActionItems } from "@/data/action-items"
import { seedNotifications } from "@/data/activity"
import { seedConversations } from "@/data/conversations"
import { seedDocuments } from "@/data/documents"
import { getPerson, personas } from "@/data/organization"
import { daysFromToday, demoNowIso } from "@/lib/format"
import { roles, type Capabilities } from "@/lib/permissions"
import type {
  ActionItem,
  ActionStatus,
  AppNotification,
  Meeting,
  CompanyId,
  Conversation,
  DocumentItem,
  NotificationKind,
  Persona,
  Scope,
} from "@/lib/types"

const STORAGE_KEY = "gs-portal-clientes-demo-v2"

export type ReminderPrefs = Record<"vencimientos" | "documentos" | "mensajes" | "entregables" | "facturas" | "novedades", { portal: boolean; email: boolean }>

interface PortalState {
  personaId: string
  scope: Scope
  actionItems: ActionItem[]
  documents: DocumentItem[]
  conversations: Conversation[]
  notifications: AppNotification[]
  prefs: ReminderPrefs
  demo: { contalinkDown: boolean; autoReplies: boolean }
  ui: { sidebarCollapsed: boolean }
  meetings: Meeting[]
  /** Novedades leídas por el usuario. */
  newsRead: string[]
}

const initialPrefs: ReminderPrefs = {
  vencimientos: { portal: true, email: true },
  documentos: { portal: true, email: true },
  mensajes: { portal: true, email: false },
  entregables: { portal: true, email: true },
  facturas: { portal: true, email: true },
  novedades: { portal: true, email: false },
}

function initialState(): PortalState {
  return {
    personaId: "ana",
    scope: "grupo",
    actionItems: seedActionItems,
    documents: seedDocuments,
    conversations: seedConversations,
    notifications: seedNotifications,
    prefs: initialPrefs,
    demo: { contalinkDown: false, autoReplies: true },
    ui: { sidebarCollapsed: false },
    meetings: [],
    newsRead: [],
  }
}

type Action =
  | { type: "hydrate"; state: PortalState }
  | { type: "reset" }
  | { type: "setPersona"; personaId: string }
  | { type: "setScope"; scope: Scope }
  | { type: "uploadVersion"; docId: string; fileName: string; size: string; note?: string; by: string }
  | { type: "createDocument"; doc: DocumentItem }
  | { type: "startReview"; docId: string }
  | { type: "reviewDocument"; docId: string; outcome: "approved" | "changes_required"; note?: string }
  | { type: "logDownload"; docId: string; format: DocumentItem["formats"][number]; by: string }
  | { type: "approveAction"; id: string; by: string }
  | { type: "requestChanges"; id: string; by: string; comment: string }
  | { type: "submitAction"; id: string; by: string; text: string }
  | { type: "sendMessage"; convId: string; authorId: string; text: string; attachments?: { name: string; size: string }[] }
  | { type: "createConversation"; conv: Conversation }
  | { type: "setConversationStatus"; convId: string; status: Conversation["status"] }
  | { type: "markConversationRead"; convId: string }
  | { type: "notify"; notification: AppNotification }
  | { type: "readNotification"; id: string }
  | { type: "readAllNotifications" }
  | { type: "setPref"; key: keyof ReminderPrefs; channel: "portal" | "email"; value: boolean }
  | { type: "setDemo"; key: keyof PortalState["demo"]; value: boolean }
  | { type: "setSidebarCollapsed"; value: boolean }
  | { type: "requestMeeting"; meeting: Meeting }
  | { type: "setMeetingStatus"; id: string; status: Meeting["status"] }
  | { type: "readNews"; id: string }
  | { type: "completeAction"; id: string; by: string; text: string }

let seq = 0
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`

function name(id: string) {
  const p = getPerson(id)
  return `${p.firstName} ${p.lastName}`
}

function updateAction(items: ActionItem[], id: string | undefined, fn: (a: ActionItem) => ActionItem) {
  if (!id) return items
  return items.map((a) => (a.id === id ? fn(a) : a))
}

function notification(kind: NotificationKind, title: string, description: string, href: string, companies: CompanyId[]): AppNotification {
  return { id: uid("N"), kind, title, description, href, companies, at: demoNowIso(), read: false }
}

function reducer(state: PortalState, action: Action): PortalState {
  const now = demoNowIso()
  switch (action.type) {
    case "hydrate":
      return action.state
    case "reset":
      return initialState()
    case "setPersona": {
      const persona = personas.find((p) => p.personId === action.personaId)!
      const scope = persona.companies.length === 1 ? persona.companies[0] : state.scope === "grupo" || persona.companies.includes(state.scope) ? state.scope : "grupo"
      return { ...state, personaId: action.personaId, scope }
    }
    case "setScope":
      return { ...state, scope: action.scope }
    case "uploadVersion": {
      const doc = state.documents.find((d) => d.id === action.docId)
      if (!doc) return state
      const version = doc.versions.length + 1
      const documents = state.documents.map((d) =>
        d.id === action.docId
          ? {
              ...d,
              status: "uploaded" as const,
              versions: [...d.versions, { version, fileName: action.fileName, size: action.size, uploadedBy: action.by, uploadedAt: now, note: action.note }],
            }
          : d
      )
      const actionItems = updateAction(state.actionItems, doc.actionItemId, (a) => ({
        ...a,
        status: "submitted",
        owner: "gs",
        history: [...a.history, { at: now, text: `${name(action.by)} subió la versión ${version}`, by: action.by }],
      }))
      return {
        ...state,
        documents,
        actionItems,
        notifications: [notification("documento_revisado", `Recibimos ${doc.name.toLowerCase()}`, `Versión ${version} · GS la revisará en breve.`, `/documentos/${doc.id}`, doc.companies), ...state.notifications],
      }
    }
    case "createDocument":
      return { ...state, documents: [action.doc, ...state.documents] }
    case "startReview": {
      const doc = state.documents.find((d) => d.id === action.docId)
      if (!doc || doc.status !== "uploaded") return state
      return {
        ...state,
        documents: state.documents.map((d) => (d.id === action.docId ? { ...d, status: "under_review" } : d)),
        actionItems: updateAction(state.actionItems, doc.actionItemId, (a) => ({
          ...a,
          status: "under_review",
          history: [...a.history, { at: now, text: "GS inició la revisión", by: a.gsOwnerId }],
        })),
      }
    }
    case "reviewDocument": {
      const doc = state.documents.find((d) => d.id === action.docId)
      if (!doc) return state
      const reviewer = doc.requestedBy ?? "andrea"
      const last = doc.versions.length
      const documents = state.documents.map((d) =>
        d.id === action.docId
          ? {
              ...d,
              status: action.outcome,
              versions: d.versions.map((v) => (v.version === last ? { ...v, review: { status: action.outcome, by: reviewer, at: now, note: action.note } } : v)),
            }
          : d
      )
      const approved = action.outcome === "approved"
      const actionItems = updateAction(state.actionItems, doc.actionItemId, (a) => ({
        ...a,
        status: approved ? "completed" : "changes_required",
        owner: approved ? a.owner : "cliente",
        reviewNote: approved ? undefined : action.note,
        completedAt: approved ? now : undefined,
        history: [...a.history, { at: now, text: approved ? `GS aprobó la versión ${last}` : "GS pidió una corrección", by: reviewer }],
      }))
      return {
        ...state,
        documents,
        actionItems,
        notifications: [
          notification(
            "documento_revisado",
            approved ? `Documento aprobado: ${doc.name.toLowerCase()}` : `Corrección solicitada: ${doc.name.toLowerCase()}`,
            approved ? `${name(reviewer)} aprobó la versión ${last}.` : (action.note ?? "Revisa el motivo en el documento."),
            `/documentos/${doc.id}`,
            doc.companies
          ),
          ...state.notifications,
        ],
      }
    }
    case "logDownload":
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.docId ? { ...d, downloads: [...d.downloads, { personId: action.by, version: d.versions.length, at: now, format: action.format }] } : d
        ),
      }
    case "approveAction": {
      const item = state.actionItems.find((a) => a.id === action.id)
      if (!item) return state
      let actionItems = updateAction(state.actionItems, action.id, (a) => ({
        ...a,
        status: "completed",
        completedAt: now,
        history: [...a.history, { at: now, text: `${name(action.by)} aprobó`, by: action.by }],
      }))
      // Evento: la aprobación desbloquea el siguiente paso de GS (Karbon / DocuSign: automatización por eventos).
      actionItems = actionItems.map((a) =>
        a.status === "blocked" && a.owner === "gs" && a.service === item.service && a.blockedReason?.includes("aprobación")
          ? { ...a, status: "open" as ActionStatus, blockedReason: undefined, history: [...a.history, { at: now, text: `Se desbloqueó con la aprobación de ${name(action.by)}`, by: a.gsOwnerId }] }
          : a
      )
      return {
        ...state,
        actionItems,
        conversations: item.conversationId
          ? state.conversations.map((c) =>
              c.id === item.conversationId ? { ...c, messages: [...c.messages, { id: uid("m"), authorId: action.by, at: now, text: `Aprobado. Pueden proceder con: ${item.title.toLowerCase()}.` }], readUpTo: c.messages.length + 1 } : c
            )
          : state.conversations,
      }
    }
    case "requestChanges": {
      const item = state.actionItems.find((a) => a.id === action.id)
      if (!item) return state
      return {
        ...state,
        actionItems: updateAction(state.actionItems, action.id, (a) => ({
          ...a,
          status: "under_review",
          owner: "gs",
          history: [...a.history, { at: now, text: `${name(action.by)} pidió cambios: “${action.comment}”`, by: action.by }],
        })),
        conversations: item.conversationId
          ? state.conversations.map((c) =>
              c.id === item.conversationId ? { ...c, status: "abierta", messages: [...c.messages, { id: uid("m"), authorId: action.by, at: now, text: action.comment }], readUpTo: c.messages.length + 1 } : c
            )
          : state.conversations,
      }
    }
    case "submitAction": {
      const item = state.actionItems.find((a) => a.id === action.id)
      if (!item) return state
      return {
        ...state,
        actionItems: updateAction(state.actionItems, action.id, (a) => ({
          ...a,
          status: "submitted",
          owner: "gs",
          history: [...a.history, { at: now, text: `${name(action.by)} respondió`, by: action.by }],
        })),
        conversations: item.conversationId
          ? state.conversations.map((c) =>
              c.id === item.conversationId ? { ...c, messages: [...c.messages, { id: uid("m"), authorId: action.by, at: now, text: action.text }], readUpTo: c.messages.length + 1 } : c
            )
          : state.conversations,
      }
    }
    case "sendMessage":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? {
                ...c,
                status: "abierta",
                messages: [...c.messages, { id: uid("m"), authorId: action.authorId, at: now, text: action.text, attachments: action.attachments }],
                // Los mensajes propios ya están leídos; los de GS quedan sin leer hasta abrir el hilo.
                readUpTo: getPerson(action.authorId).org === "cliente" ? c.messages.length + 1 : c.readUpTo,
              }
            : c
        ),
      }
    case "createConversation":
      return { ...state, conversations: [action.conv, ...state.conversations] }
    case "setConversationStatus":
      return { ...state, conversations: state.conversations.map((c) => (c.id === action.convId ? { ...c, status: action.status } : c)) }
    case "markConversationRead":
      return {
        ...state,
        conversations: state.conversations.map((c) => (c.id === action.convId && c.readUpTo !== c.messages.length ? { ...c, readUpTo: c.messages.length } : c)),
      }
    case "notify":
      return { ...state, notifications: [action.notification, ...state.notifications] }
    case "readNotification":
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)) }
    case "readAllNotifications":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }
    case "setPref":
      return { ...state, prefs: { ...state.prefs, [action.key]: { ...state.prefs[action.key], [action.channel]: action.value } } }
    case "setDemo":
      return { ...state, demo: { ...state.demo, [action.key]: action.value } }
    case "setSidebarCollapsed":
      return { ...state, ui: { ...state.ui, sidebarCollapsed: action.value } }
    case "requestMeeting":
      return { ...state, meetings: [...state.meetings, action.meeting] }
    case "setMeetingStatus": {
      const meeting = state.meetings.find((m) => m.id === action.id)
      if (!meeting) return state
      const host = getPerson(meeting.hostId)
      return {
        ...state,
        meetings: state.meetings.map((m) => (m.id === action.id ? { ...m, status: action.status } : m)),
        notifications:
          action.status === "confirmada"
            ? [
                notification(
                  "mensaje",
                  `${host.firstName} ${host.lastName} confirmó la reunión`,
                  `${meeting.topic} · ${meeting.date.slice(8)}/${meeting.date.slice(5, 7)} a las ${meeting.time} h`,
                  "/calendario",
                  meeting.companies
                ),
                ...state.notifications,
              ]
            : state.notifications,
      }
    }
    case "completeAction":
      return {
        ...state,
        actionItems: updateAction(state.actionItems, action.id, (a) => ({
          ...a,
          status: "completed",
          completedAt: now,
          history: [...a.history, { at: now, text: action.text, by: action.by }],
        })),
      }
    case "readNews":
      return state.newsRead.includes(action.id) ? state : { ...state, newsRead: [...state.newsRead, action.id] }
  }
}

/** Respuestas simuladas de GS por conversación. */
const autoReplies: Record<string, string> = {
  "CONV-01": "Gracias, Laura. En cuanto vea la nueva versión la reviso; hoy mismo te confirmo.",
  "CONV-02": "Gracias, Ana. Ajustamos lo que comentas y te aviso en cuanto esté la nueva versión del papel de trabajo.",
  "CONV-03": "Perfecto, gracias. Con eso registramos la depreciación a partir de ese mes y lo verás reflejado en el cierre.",
  "CONV-05": "Gracias por confirmar. Te enviamos el calendario detallado de la visita el viernes.",
  "CONV-06": "Entendido. Te aviso en cuanto el notario valide el acta para habilitar la firma.",
}

interface PortalContextValue {
  state: PortalState
  hydrated: boolean
  persona: Persona
  can: Capabilities
  /** Empresas a las que tiene acceso la persona simulada. */
  allowed: CompanyId[]
  /** Quién está escribiendo en cada conversación (simulación). */
  typing: Record<string, string | undefined>
  setPersona: (id: string) => void
  setScope: (scope: Scope) => void
  uploadVersion: (docId: string, file: { name: string; size: string }, note?: string) => void
  createDocument: (doc: Omit<DocumentItem, "id" | "downloads" | "versions" | "status">, file: { name: string; size: string }, note?: string) => string
  reviewDocument: (docId: string, outcome: "approved" | "changes_required", note?: string) => void
  logDownload: (docId: string, format: DocumentItem["formats"][number]) => void
  approveAction: (id: string) => void
  requestChanges: (id: string, comment: string) => void
  submitAction: (id: string, text: string) => void
  sendMessage: (convId: string, text: string, attachments?: { name: string; size: string }[]) => void
  createConversation: (input: Pick<Conversation, "subject" | "context" | "companies" | "service" | "gsOwnerId">, text: string) => string
  setConversationStatus: (convId: string, status: Conversation["status"]) => void
  markConversationRead: (convId: string) => void
  readNotification: (id: string) => void
  readAllNotifications: () => void
  setPref: (key: keyof ReminderPrefs, channel: "portal" | "email", value: boolean) => void
  setDemo: (key: keyof PortalState["demo"], value: boolean) => void
  setSidebarCollapsed: (value: boolean) => void
  requestMeeting: (input: Omit<Meeting, "id" | "status" | "requestedBy" | "requestedAt">) => Meeting
  cancelMeeting: (id: string) => void
  readNews: (id: string) => void
  /** Avisos y registros que generan otros módulos (contratos, pagos, usuarios). */
  notify: (kind: NotificationKind, title: string, description: string, href: string, companies?: CompanyId[]) => void
  addDocument: (doc: DocumentItem) => void
  completeAction: (id: string, text: string) => void
  reset: () => void
}

const PortalContext = createContext<PortalContextValue | null>(null)

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [hydrated, setHydrated] = useState(false)
  const [typing, setTyping] = useState<Record<string, string | undefined>>({})
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Carga la sesión de demo guardada en este navegador.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) dispatch({ type: "hydrate", state: { ...initialState(), ...JSON.parse(saved) } })
    } catch {
      // Sin almacenamiento disponible: se usa el estado inicial.
    }
    // Sincroniza con un sistema externo (localStorage) una sola vez al montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignorado: la demo funciona sin persistencia.
    }
  }, [state, hydrated])

  const persona = personas.find((p) => p.personId === state.personaId) ?? personas[0]
  const can = roles[persona.role].can

  const later = useCallback((ms: number, fn: () => void) => {
    window.setTimeout(fn, ms)
  }, [])

  const value = useMemo<PortalContextValue>(() => {
    const me = persona.personId
    return {
      state,
      hydrated,
      persona,
      can,
      allowed: persona.companies,
      typing,
      setPersona: (id) => dispatch({ type: "setPersona", personaId: id }),
      setScope: (scope) => dispatch({ type: "setScope", scope }),
      uploadVersion: (docId, file, note) => {
        dispatch({ type: "uploadVersion", docId, fileName: file.name, size: file.size, note, by: me })
        if (stateRef.current.demo.autoReplies) later(4000, () => dispatch({ type: "startReview", docId }))
      },
      createDocument: (input, file, note) => {
        const id = uid("DOC")
        dispatch({
          type: "createDocument",
          doc: {
            ...input,
            id,
            status: "uploaded",
            downloads: [],
            versions: [{ version: 1, fileName: file.name, size: file.size, uploadedBy: me, uploadedAt: demoNowIso(), note }],
          },
        })
        if (stateRef.current.demo.autoReplies) later(4000, () => dispatch({ type: "startReview", docId: id }))
        return id
      },
      reviewDocument: (docId, outcome, note) => dispatch({ type: "reviewDocument", docId, outcome, note }),
      logDownload: (docId, format) => dispatch({ type: "logDownload", docId, format, by: me }),
      approveAction: (id) => dispatch({ type: "approveAction", id, by: me }),
      requestChanges: (id, comment) => dispatch({ type: "requestChanges", id, by: me, comment }),
      submitAction: (id, text) => {
        dispatch({ type: "submitAction", id, by: me, text })
        const conv = stateRef.current.actionItems.find((a) => a.id === id)?.conversationId
        if (conv) simulateReply(conv)
      },
      sendMessage: (convId, text, attachments) => {
        dispatch({ type: "sendMessage", convId, authorId: me, text, attachments })
        simulateReply(convId)
      },
      createConversation: (input, text) => {
        const id = uid("CONV")
        dispatch({
          type: "createConversation",
          conv: { ...input, id, participants: [input.gsOwnerId, me], status: "abierta", readUpTo: 1, messages: [{ id: uid("m"), authorId: me, at: demoNowIso(), text }] },
        })
        simulateReply(id)
        return id
      },
      setConversationStatus: (convId, status) => dispatch({ type: "setConversationStatus", convId, status }),
      markConversationRead: (convId) => dispatch({ type: "markConversationRead", convId }),
      readNotification: (id) => dispatch({ type: "readNotification", id }),
      readAllNotifications: () => dispatch({ type: "readAllNotifications" }),
      setPref: (key, channel, value) => dispatch({ type: "setPref", key, channel, value }),
      setDemo: (key, value) => dispatch({ type: "setDemo", key, value }),
      setSidebarCollapsed: (value) => dispatch({ type: "setSidebarCollapsed", value }),
      requestMeeting: (input) => {
        const meeting: Meeting = { ...input, id: uid("MTG"), status: "solicitada", requestedBy: me, requestedAt: demoNowIso() }
        dispatch({ type: "requestMeeting", meeting })
        // GS confirma la reunión unos segundos después (simulación).
        later(3500, () => dispatch({ type: "setMeetingStatus", id: meeting.id, status: "confirmada" }))
        return meeting
      },
      cancelMeeting: (id) => dispatch({ type: "setMeetingStatus", id, status: "cancelada" }),
      readNews: (id) => dispatch({ type: "readNews", id }),
      notify: (kind, title, description, href, companies = persona.companies) => dispatch({ type: "notify", notification: notification(kind, title, description, href, companies) }),
      addDocument: (doc) => dispatch({ type: "createDocument", doc }),
      completeAction: (id, text) => dispatch({ type: "completeAction", id, by: me, text }),
      reset: () => {
        dispatch({ type: "reset" })
        toast.success("Datos de la demo restablecidos")
      },
    }

    function simulateReply(convId: string) {
      if (!stateRef.current.demo.autoReplies) return
      later(900, () => {
        const conv = stateRef.current.conversations.find((c) => c.id === convId)
        if (!conv) return
        const gsId = conv.gsOwnerId
        setTyping((t) => ({ ...t, [convId]: gsId }))
        later(2600, () => {
          setTyping((t) => ({ ...t, [convId]: undefined }))
          const first = getPerson(stateRef.current.personaId).firstName
          const text = autoReplies[convId] ?? `Gracias, ${first}. Lo reviso con el equipo y te respondo hoy antes de las 18:00.`
          dispatch({ type: "sendMessage", convId, authorId: gsId, text })
          const author = getPerson(gsId)
          dispatch({
            type: "notify",
            notification: notification("mensaje", `${author.firstName} ${author.lastName} respondió`, conv.subject, `/mensajes/${convId}`, conv.companies),
          })
        })
      })
    }
  }, [state, hydrated, persona, can, typing, later])

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}

export function usePortal() {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error("usePortal debe usarse dentro de PortalProvider")
  return ctx
}

/** Estado efectivo: un pendiente abierto con fecha pasada se muestra como vencido. */
export function effectiveStatus(item: ActionItem): ActionStatus {
  if ((item.status === "open" || item.status === "changes_required") && item.owner === "cliente" && daysFromToday(item.dueDate) < 0) return "overdue"
  return item.status
}
