import type { Metadata } from "next"

import { NewsView } from "@/components/features/novedades/news-view"

export const metadata: Metadata = { title: "Novedades" }

export default function NovedadesPage() {
  return <NewsView />
}
