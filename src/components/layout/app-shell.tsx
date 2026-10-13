"use client"

import { useState } from "react"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { usePortal } from "@/store/portal-store"
import { AppSidebar } from "./app-sidebar"
import { IntegrationBanner } from "./integration-banner"
import { MobileTabBar } from "./mobile-tab-bar"
import { TopNavigation } from "./top-navigation"

/** Layout principal: sidebar izquierda, header con contexto activo y área de contenido. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { hydrated } = usePortal()

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 lg:block">
        <AppSidebar />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0 sm:max-w-72" showCloseButton={false}>
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="sr-only">Secciones del portal.</SheetDescription>
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavigation onMenuClick={() => setMobileOpen(true)} />
        <IntegrationBanner />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pt-6 lg:pb-10">{hydrated ? children : <ShellSkeleton />}</main>
      </div>

      <MobileTabBar onMore={() => setMobileOpen(true)} />
    </div>
  )
}

/** Estado de carga mientras se recupera la sesión de demo del navegador. */
function ShellSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}
