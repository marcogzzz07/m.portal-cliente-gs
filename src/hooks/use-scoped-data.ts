"use client"

import { useMemo } from "react"

import { seedEvents } from "@/data/calendar"
import { companies, group } from "@/data/organization"
import { canSeeAction, canSeeConversation, canSeeDocument, matchesScope } from "@/lib/permissions"
import type { ActionItem, CalendarEvent, EventType } from "@/lib/types"
import { effectiveStatus, usePortal } from "@/store/portal-store"

const kindToEvent: Record<ActionItem["kind"], EventType> = {
  subir: "contable",
  aprobar: "fiscal",
  firmar: "contractual",
  pagar: "pago",
  responder: "proyecto",
  confirmar: "proyecto",
}

function eventTypeFor(item: ActionItem): EventType {
  if (item.kind === "pagar" || item.kind === "firmar") return kindToEvent[item.kind]
  if (item.service === "impuestos") return "fiscal"
  if (item.service === "contabilidad") return "contable"
  return "proyecto"
}

/**
 * Datos visibles para la persona simulada dentro del contexto activo (grupo o razón social).
 * Toda pantalla consume la información a través de este hook para respetar permisos y alcance.
 */
export function useScopedData() {
  const { state, persona, allowed } = usePortal()
  const { scope } = state

  return useMemo(() => {
    const inScope = (c: ActionItem["companies"]) => matchesScope(c, scope, allowed)

    const actions = state.actionItems.filter((a) => canSeeAction(persona, a) && inScope(a.companies))
    const documents = state.documents.filter((d) => canSeeDocument(persona, d) && inScope(d.companies))
    const conversations = state.conversations.filter((c) => canSeeConversation(persona, c) && inScope(c.companies))
    const notifications = state.notifications.filter((n) => n.companies.some((c) => allowed.includes(c)))

    const openForClient = actions.filter((a) => a.owner === "cliente" && a.status !== "completed" && a.status !== "upcoming")
    const pendingCount = openForClient.filter((a) => a.status !== "blocked").length
    const unreadMessages = state.conversations
      .filter((c) => canSeeConversation(persona, c))
      .reduce((n, c) => n + Math.max(0, c.messages.length - c.readUpTo), 0)

    const derivedEvents: CalendarEvent[] = actions
      // Vencimientos del cliente y entregas de GS; las revisiones en curso de GS no son fechas del calendario.
      .filter((a) => a.status !== "completed" && !(a.owner === "gs" && (a.status === "submitted" || a.status === "under_review")))
      .map((a) => ({
        id: `due-${a.id}`,
        title: a.owner === "gs" && !a.assigneeId ? `GS: ${a.title}` : `Vence: ${a.title}`,
        type: eventTypeFor(a),
        date: a.dueDate,
        companies: a.companies,
        service: a.service,
        description: a.description,
        actionItemId: a.id,
        derived: true,
      }))
    const meetingEvents: CalendarEvent[] = state.meetings
      .filter((m) => m.status !== "cancelada" && inScope(m.companies))
      .map((m) => ({
        id: m.id,
        title: m.topic,
        type: "reunion" as const,
        date: m.date,
        time: m.time,
        endTime: m.endTime,
        companies: m.companies,
        service: m.service,
        description: m.notes || "Reunión solicitada desde el portal.",
        location: m.modality === "video" ? "Videollamada (liga en la invitación)" : m.modality === "oficinas_gs" ? "Oficinas GS, Monterrey" : "Oficinas del cliente",
        meetingId: m.id,
        meetingStatus: m.status,
      }))
    const events = [...seedEvents.filter((e) => inScope(e.companies)), ...derivedEvents, ...meetingEvents].sort((a, b) =>
      `${a.date}${a.time ?? "00:00"}`.localeCompare(`${b.date}${b.time ?? "00:00"}`)
    )

    const scopeLabel = scope === "grupo" ? group.name : companies.find((c) => c.id === scope)!.name
    const scopeCompanies = scope === "grupo" ? allowed : [scope]
    /** Etiqueta corta para el encabezado de página: "Grupo completo" o "Comercial". */
    const scopeBadge = scope === "grupo" ? "Grupo completo" : scopeLabel.replace("EcoPack ", "")

    return {
      scope,
      scopeLabel,
      scopeBadge,
      scopeCompanies,
      actions,
      documents,
      conversations,
      notifications,
      events,
      pendingCount,
      unreadMessages,
      effectiveStatus,
    }
  }, [state, persona, allowed, scope])
}
