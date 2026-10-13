import type { Metadata } from "next"

import { MessagesView } from "@/components/features/mensajes/messages-view"

export const metadata: Metadata = { title: "Mensajes" }

/** /mensajes/nuevo abre el diálogo de nueva conversación; cualquier otro id abre el hilo. */
export default async function ConversationPage({ params }: PageProps<"/mensajes/[id]">) {
  const { id } = await params
  return id === "nuevo" ? <MessagesView compose /> : <MessagesView threadId={id} />
}
