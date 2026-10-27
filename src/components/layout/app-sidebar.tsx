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
import { ThemeToggle } from "./theme-toggle"

interface AppSidebarProps {
  /** Se llama al navegar (cierra el menú en tablet/móvil). */
  onNavigate?: () => void
  /** Modo compacto: solo íconos. */
  collapsed?: boolean
  onToggle?: () => void
  /** Tarjeta flotante con contorno (escritorio). En móvil la barra va de orilla a orilla. */
  floating?: boolean
  className?: string
}

/**
 * Barra lateral con el diseño del Portal GS: gris muy claro (vidrio en Claro) o
 * grafito en Oscuro, página activa en rojo GS, grupos separados por una línea
 * fina y al pie el selector de tema y la tarjeta de perfil.
 */
export function AppSidebar({ onNavigate, collapsed = false, onToggle, floating = false, className }: AppSidebarProps) {
  const pathname = usePathname()
  const active = findActiveNavItem(pathname)
  const { persona } = usePortal()
  const { pendingCount, unreadMessages } = useScopedData()
  const badges = { pendientes: pendingCount, mensajes: unreadMessages }

  return (
    <div className={cn("sb-dark flex h-full flex-col overflow-hidden", floating && "gs-sidebar-floating", className)}>
      <div className={cn("flex items-center gap-2 pt-5 pb-4", collapsed ? "flex-col px-3" : "px-4")}>
        <Link href={site.home} onClick={onNavigate} className="gs-focusable min-w-0 flex-1 rounded-[var(--gs-radius-md)]" aria-label={site.name}>
          {collapsed ? <BrandMark className="mx-auto" /> : <BrandLogo />}
        </Link>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="gs-focusable flex size-8 shrink-0 items-center justify-center rounded-[var(--gs-radius-md)] text-[var(--gs-color-text-inverse-muted)] transition-colors hover:bg-[var(--gs-color-surface-inverse-hover)] hover:text-[var(--gs-color-text-inverse)]"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        )}
      </div>

      <nav className={cn("gs-scrollbar gs-scrollbar-inverse flex-1 overflow-y-auto pb-4", collapsed ? "px-3" : "px-3")} aria-label="Navegación principal">
        {navigation.map((section, i) => {
          // Los módulos sin permiso se ocultan (Product Spec §8).
          const items = section.items.filter((item) => !item.hidden && canAccessModule(persona, item.module))
          if (items.length === 0) return null
          return (
            <div key={section.label}>
              {i > 0 && <div className="gs-sidebar-divider" aria-hidden />}
              {i > 0 && !collapsed && <p className="gs-sidebar-section-label">{section.label}</p>}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <NavLink key={item.href} item={item} active={active?.href === item.href} count={item.badge ? badges[item.badge] : 0} collapsed={collapsed} onNavigate={onNavigate} />
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-[var(--gs-color-border-inverse)] p-3">
        <div className={cn("flex flex-col", collapsed ? "gap-1" : "gap-0.5")}>
          <ThemeToggle collapsed={collapsed} />
          <SidebarUser collapsed={collapsed} />
        </div>
      </div>
    </div>
  )
}

function NavLink({ item, active, count, collapsed, onNavigate }: { item: NavItem; active: boolean; count: number; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? `${item.title}${count > 0 ? `, ${count} sin atender` : ""}` : undefined}
      data-active={active}
      data-collapsed={collapsed}
      className="gs-sidebar-nav-item gs-focusable"
    >
      <Icon aria-hidden />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.title}</span>}
      {!collapsed && item.phase && !active && <span className="text-[11px] text-[var(--gs-color-text-disabled)]">Fase {item.phase}</span>}
      {count > 0 &&
        (collapsed ? (
          <span className="gs-sidebar-count-dot" aria-hidden />
        ) : (
          <span className="gs-sidebar-count" aria-label={`${count} sin atender`}>
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
