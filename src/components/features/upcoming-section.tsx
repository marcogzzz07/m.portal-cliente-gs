"use client"

import { CircleDashed } from "lucide-react"

import { AccessDenied } from "@/components/shared/access-denied"
import { PageHeader } from "@/components/shared/page-header"
import { PhaseBadge } from "@/components/shared/phase-badge"
import { SectionCard } from "@/components/shared/section-card"
import { navItems } from "@/config/navigation"
import { canAccessModule } from "@/lib/permissions"
import { usePortal } from "@/store/portal-store"

/** Sección que todavía no se construye: explica qué incluirá y en qué fase. */
export function UpcomingSection({ href }: { href: string }) {
  const { persona } = usePortal()
  const item = navItems.find((i) => i.href === href)!
  if (!canAccessModule(persona, item.module)) return <AccessDenied />

  return (
    <div className="space-y-6">
      <PageHeader icon={item.icon} title={item.title} description={item.description} actions={item.phase ? <PhaseBadge phase={item.phase} className="text-sm" /> : undefined} />
      <SectionCard title={`Se construye en la Fase ${item.phase}`} description="Esta sección forma parte del alcance del prototipo y se revisará en su propia fase." icon={CircleDashed}>
        <ul className="space-y-2">
          {item.upcoming?.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
