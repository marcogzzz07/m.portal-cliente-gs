"use client"

import { useState } from "react"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"
import { AppSidebar } from "./app-sidebar"
import { DemoBanner } from "./demo-banner"
import { IntegrationBanner } from "./integration-banner"
import { MobileTabBar } from "./mobile-tab-bar"
import { TopNavigation } from "./top-navigation"

/** Layout principal: sidebar colapsable, franja de demo, encabezado y área de contenido. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { hydrated, state, setSidebarCollapsed } = usePortal()
  const collapsed = state.ui.sidebarCollapsed

  return (
    <div className="flex min-h-dvh">
      <aside className={cn("sticky top-0 hidden h-dvh shrink-0 transition-[width] duration-200 lg:block", collapsed ? "w-[76px]" : "w-64")}>
        <AppSidebar collapsed={collapsed} onToggle={() => setSidebarCollapsed(!collapsed)} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0 sm:max-w-72" showCloseButton={false}>
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="sr-only">Secciones del portal.</SheetDescription>
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <TopNavigation onMenuClick={() => setMobileOpen(true)} />
        <IntegrationBanner />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-2 pb-28 sm:px-6 lg:px-8 lg:pt-4 lg:pb-10">{hydrated ? children : <ShellSkeleton />}</main>
      </div>

      <MobileTabBar onMore={() => setMobileOpen(true)} />
    </div>
  )
}

/** Estado de carga mientras se recupera la sesión de demo del navegador. */
function ShellSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}
