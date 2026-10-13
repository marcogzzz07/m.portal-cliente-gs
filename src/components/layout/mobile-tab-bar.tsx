"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { findActiveNavItem, navItems } from "@/config/navigation"
import { useScopedData } from "@/hooks/use-scoped-data"
import { canAccessModule } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"

const preferred = ["/", "/pendientes", "/documentos", "/mensajes", "/calendario", "/equipo"]

/** Barra inferior en móvil: las cuatro secciones más usadas que el rol puede ver, y "Más". */
export function MobileTabBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname()
  const active = findActiveNavItem(pathname)
  const { persona } = usePortal()
  const { pendingCount, unreadMessages } = useScopedData()
  const items = preferred
    .map((href) => navItems.find((i) => i.href === href)!)
    .filter((i) => canAccessModule(persona, i.module))
    .slice(0, 4)
  const counts: Record<string, number> = { "/pendientes": pendingCount, "/mensajes": unreadMessages }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden" aria-label="Navegación inferior">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active?.href === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn("relative flex flex-col items-center gap-0.5 px-1 pt-2 pb-1.5 text-[11px] font-medium text-muted-foreground", isActive && "text-brand")}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {counts[item.href] > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">{counts[item.href]}</span>
                  )}
                </span>
                <span className="truncate">{item.title}</span>
              </Link>
            </li>
          )
        })}
        <li>
          <button type="button" onClick={onMore} className="flex w-full flex-col items-center gap-0.5 px-1 pt-2 pb-1.5 text-[11px] font-medium text-muted-foreground">
            <Menu className="size-5" />
            Más
          </button>
        </li>
      </ul>
    </nav>
  )
}
