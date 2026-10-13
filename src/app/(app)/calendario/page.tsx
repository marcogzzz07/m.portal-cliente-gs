import type { Metadata } from "next"

import { CalendarView } from "@/components/features/calendario/calendar-view"

export const metadata: Metadata = { title: "Calendario" }

export default function CalendarioPage() {
  return <CalendarView />
}
