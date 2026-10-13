import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { UpcomingSection } from "@/components/features/upcoming-section"
import { navItems } from "@/config/navigation"

/**
 * Ruta comodín: secciones del menú que se construyen en fases posteriores del prototipo.
 * Cuando una sección tenga su propia carpeta en app/(app), esa ruta tiene prioridad.
 */
type Props = { params: Promise<{ slug: string[] }> }

const findItem = (slug: string[]) => {
  const href = `/${slug.map(decodeURIComponent).join("/")}`
  return navItems.find((i) => i.href === href)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: findItem((await params).slug)?.title ?? "Página no encontrada" }
}

export default async function SectionPage({ params }: Props) {
  const item = findItem((await params).slug)
  if (!item) notFound()
  return <UpcomingSection href={item.href} />
}
