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
      {/* Barra flotante (Portal GS): 12 px de margen arriba, abajo y a la izquierda; 260 px o 75 px de ancho. */}
      <aside className={cn("sticky top-0 hidden h-dvh shrink-0 py-3 pl-3 transition-[width] duration-200 lg:block", collapsed ? "w-[87px]" : "w-[272px]")}>
        <AppSidebar floating collapsed={collapsed} onToggle={() => setSidebarCollapsed(!collapsed)} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-0 bg-transparent p-0 sm:max-w-72" showCloseButton={false}>
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="sr-only">Secciones del portal.</SheetDescription>
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <DemoBanner />
        <TopNavigation onMenuClick={() => setMobileOpen(true)} />
        <IntegrationBanner />
        <main className="mx-auto w-full max-w-[100rem] flex-1 px-4 pt-1 pb-28 sm:px-6 lg:pt-2 lg:pb-8">{hydrated ? children : <ShellSkeleton />}</main>
      </div>

      <MobileTabBar onMore={() => setMobileOpen(true)} />
    </div>
  )
}

/** Estado de carga mientras se recupera la sesión de demo del navegador. */
function ShellSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-16 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-lg" />
    </div>
  )
}
