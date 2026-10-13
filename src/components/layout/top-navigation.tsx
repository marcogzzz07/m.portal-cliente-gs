"use client"

import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GlobalSearch } from "./global-search"
import { HelpMenu } from "./help-menu"
import { NotificationsMenu } from "./notifications-menu"

export function TopNavigation({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon-lg" className="shrink-0 lg:hidden" onClick={onMenuClick} aria-label="Abrir menú">
        <Menu className="size-5" />
      </Button>

      <GlobalSearch className="hidden max-w-md bg-card sm:flex" />

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <GlobalSearch compact className="sm:hidden" />
        <HelpMenu />
        <NotificationsMenu />
      </div>
    </header>
  )
}
