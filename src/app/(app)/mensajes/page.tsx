import type { Metadata } from "next"

import { MessagesView } from "@/components/features/mensajes/messages-view"

export const metadata: Metadata = { title: "Mensajes" }

export default function MensajesPage() {
  return <MessagesView />
}
