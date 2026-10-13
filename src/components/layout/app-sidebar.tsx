"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { PhaseBadge } from "@/components/shared/phase-badge"
import { findActiveNavItem, navigation, type NavItem } from "@/config/navigation"
import { site } from "@/config/site"
import { useScopedData } from "@/hooks/use-scoped-data"
import { canAccessModule } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"
import { BrandLogo } from "./brand-logo"
import { SidebarUser } from "./sidebar-user"

interface AppSidebarProps {
  /** Se llama al navegar (cierra el menú en tablet/móvil). */
  onNavigate?: () => void
  className?: string
}

export function AppSidebar({ onNavigate, className }: AppSidebarProps) {
  const pathname = usePathname()
  const active = findActiveNavItem(pathname)
  const { persona } = usePortal()
  const { pendingCount, unreadMessages } = useScopedData()
  const badges = { pendientes: pendingCount, mensajes: unreadMessages }

  return (
    <div className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground", className)}>
      <div className="px-5 pt-6 pb-6">
        <Link href={site.home} onClick={onNavigate}>
          <BrandLogo />
        </Link>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 pb-6" aria-label="Navegación principal">
        {navigation.map((section) => {
          // Los módulos sin permiso se ocultan (Product Spec §8).
          const items = section.items.filter((i) => !i.hidden && canAccessModule(persona, i.module))
          if (items.length === 0) return null
          return (
            <div key={section.label}>
              <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">{section.label}</p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <NavLink key={item.href} item={item} active={active?.href === item.href} count={item.badge ? badges[item.badge] : 0} onNavigate={onNavigate} />
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <SidebarUser />
      </div>
    </div>
  )
}

function NavLink({ item, active, count, onNavigate }: { item: NavItem; active: boolean; count: number; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
          active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
        )}
      >
        {active && <span className="absolute top-2 bottom-2 -left-0.5 w-[3px] rounded-full bg-sidebar-primary" aria-hidden />}
        <Icon className={cn("size-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100", active && "opacity-100")} />
        <span className="flex-1 truncate">{item.title}</span>
        {item.phase && <PhaseBadge phase={item.phase} compact />}
        {count > 0 ? (
          <span className="rounded-full bg-sidebar-primary px-1.5 py-px text-[10px] font-semibold text-sidebar-primary-foreground tabular-nums" aria-label={`${count} sin atender`}>
            {count}
          </span>
        ) : null}
      </Link>
    </li>
  )
}
