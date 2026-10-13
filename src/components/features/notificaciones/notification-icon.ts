import { AlarmClock, FileCheck2, FileSignature, Lightbulb, ListPlus, MessageSquare, PackageCheck, Receipt, ShieldAlert } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { NotificationKind } from "@/lib/types"

export const notificationIcon: Record<NotificationKind, LucideIcon> = {
  pendiente_nuevo: ListPlus,
  vencimiento: AlarmClock,
  documento_revisado: FileCheck2,
  entregable: PackageCheck,
  firma: FileSignature,
  factura: Receipt,
  mensaje: MessageSquare,
  insight: Lightbulb,
  seguridad: ShieldAlert,
}

export const notificationKindLabel: Record<NotificationKind, string> = {
  pendiente_nuevo: "Nuevo pendiente",
  vencimiento: "Vencimiento",
  documento_revisado: "Documento",
  entregable: "Entregable",
  firma: "Firma",
  factura: "Factura",
  mensaje: "Mensaje",
  insight: "Insight",
  seguridad: "Seguridad",
}

