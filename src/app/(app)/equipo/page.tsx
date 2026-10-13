import type { Metadata } from "next"

import { TeamView } from "@/components/features/equipo/team-view"

export const metadata: Metadata = { title: "Equipo GS" }

export default function EquipoPage() {
  return <TeamView />
}
