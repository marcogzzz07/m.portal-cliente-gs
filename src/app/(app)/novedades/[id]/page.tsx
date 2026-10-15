import type { Metadata } from "next"

import { NewsDetail } from "@/components/features/novedades/news-detail"

export const metadata: Metadata = { title: "Novedades" }

export default async function NovedadPage({ params }: PageProps<"/novedades/[id]">) {
  const { id } = await params
  return <NewsDetail id={id} />
}
