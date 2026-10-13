"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { findActiveNavItem, navigation, type NavItem } from "@/config/navigation"
import { site } from "@/config/site"
import { useScopedData } from "@/hooks/use-scoped-data"
import { canAccessModule } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"
import { BrandLogo, BrandMark } from "./brand-logo"
import { SidebarUser } from "./sidebar-user"

interface AppSidebarProps {
  /** Se llama al navegar (cierra el menú en tablet/móvil). */
  onNavigate?: () => void
  /** Modo compacto: solo íconos. */
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

export function AppSidebar({ onNavigate, collapsed = false, onToggle, className }: AppSidebarProps) {
  const pathname = usePathname()
  const active = findActiveNavItem(pathname)
  const { persona } = usePortal()
  const { pendingCount, unreadMessages } = useScopedData()
  const badges = { pendientes: pendingCount, mensajes: unreadMessages }

  return (
    <div className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground", className)}>
      <div className={cn("flex items-center gap-2 pt-6 pb-7", collapsed ? "flex-col px-3" : "px-5")}>
        <Link href={site.home} onClick={onNavigate} className="min-w-0 flex-1" aria-label={site.name}>
          {collapsed ? <BrandMark className="mx-auto" /> : <BrandLogo />}
        </Link>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          </button>
        )}
      </div>

      <nav className={cn("scrollbar-thin flex-1 space-y-7 overflow-y-auto pb-6", collapsed ? "px-3" : "px-4")} aria-label="Navegación principal">
        {navigation.map((section, i) => {
          // Los módulos sin permiso se ocultan (Product Spec §8).
          const items = section.items.filter((item) => !item.hidden && canAccessModule(persona, item.module))
          if (items.length === 0) return null
          return (
            <div key={section.label}>
              {i > 0 &&
                (collapsed ? (
                  <div className="mx-2 mb-3 border-t border-sidebar-border" />
                ) : (
                  <p className="px-3 pb-2.5 text-[11px] font-semibold tracking-wider text-sidebar-foreground/45 uppercase">{section.label}</p>
                ))}
              <ul className="space-y-1">
                {items.map((item) => (
                  <NavLink key={item.href} item={item} active={active?.href === item.href} count={item.badge ? badges[item.badge] : 0} collapsed={collapsed} onNavigate={onNavigate} />
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <SidebarUser collapsed={collapsed} />
      </div>
    </div>
  )
}

function NavLink({ item, active, count, collapsed, onNavigate }: { item: NavItem; active: boolean; count: number; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon
  const upcoming = Boolean(item.phase)
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.title : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl py-2.5 text-[15px] transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
        upcoming && !active && "text-sidebar-foreground/60",
        active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      )}
    >
      {active && <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-full bg-sidebar-primary" aria-hidden />}
      <Icon className={cn("size-[18px] shrink-0 opacity-75 transition-opacity group-hover:opacity-100", active && "opacity-100")} />
      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
      {count > 0 &&
        (collapsed ? (
          <span className="absolute top-1.5 right-2 size-2 rounded-full bg-sidebar-primary" aria-label={`${count} sin atender`} />
        ) : (
          <span className="min-w-5 rounded-full bg-sidebar-primary px-1.5 py-px text-center text-[11px] font-semibold text-sidebar-primary-foreground tabular-nums" aria-label={`${count} sin atender`}>
            {count}
          </span>
        ))}
    </Link>
  )

  return (
    <li>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">
            {item.title}
            {item.phase ? ` · Fase ${item.phase}` : ""}
          </TooltipContent>
        </Tooltip>
      ) : (
        link
      )}
    </li>
  )
}
