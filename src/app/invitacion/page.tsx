import type { Metadata } from "next"

import { ActivationFlow } from "@/components/features/invitacion/activation-flow"

export const metadata: Metadata = { title: "Activa tu acceso" }

/** Fuera del layout del portal: es lo que ve una persona invitada antes de tener cuenta. */
export default function InvitacionPage() {
  return <ActivationFlow />
}
