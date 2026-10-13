"use client"

import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ContextSwitcher } from "./context-switcher"
import { DemoPanel } from "./demo-panel"
import { GlobalSearch } from "./global-search"
import { HelpMenu } from "./help-menu"
import { NotificationsMenu } from "./notifications-menu"

export function TopNavigation({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-transparent bg-background/85 px-3 backdrop-blur-md sm:gap-3 sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon-lg" className="shrink-0 lg:hidden" onClick={onMenuClick} aria-label="Abrir menú">
        <Menu className="size-5" />
      </Button>

      <ContextSwitcher />

      <GlobalSearch className="hidden min-w-0 max-w-sm bg-card xl:flex" />

      <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
        <DemoPanel />
        <GlobalSearch compact className="xl:hidden" />
        <HelpMenu />
        <NotificationsMenu />
      </div>
    </header>
  )
}
