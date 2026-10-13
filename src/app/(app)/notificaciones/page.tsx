import type { Metadata } from "next"

import { NotificationsView } from "@/components/features/notificaciones/notifications-view"

export const metadata: Metadata = { title: "Notificaciones" }

export default function NotificacionesPage() {
  return <NotificationsView />
}
