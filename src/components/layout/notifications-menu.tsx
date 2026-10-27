"use client"

import Link from "next/link"
import { Bell, CheckCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useScopedData } from "@/hooks/use-scoped-data"
import { formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"
import { notificationIcon } from "@/components/features/notificaciones/notification-icon"

export function NotificationsMenu() {
  const { readNotification, readAllNotifications } = usePortal()
  const { notifications } = useScopedData()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="relative rounded-full" aria-label={unread ? `Notificaciones (${unread} sin leer)` : "Notificaciones"}>
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums ring-2 ring-background">{unread}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold text-foreground">Notificaciones</DropdownMenuLabel>
          <Button variant="ghost" size="xs" onClick={readAllNotifications} disabled={unread === 0} className="text-brand">
            <CheckCheck />
            Marcar todo como leído
          </Button>
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-96 overflow-y-auto p-1">
          {notifications.slice(0, 8).map((n) => {
            const Icon = notificationIcon[n.kind]
            return (
              <DropdownMenuItem key={n.id} asChild className="items-start gap-3 rounded-lg px-2.5 py-2.5">
                <Link href={n.href} onClick={() => readNotification(n.id)}>
                  <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted", n.read ? "text-muted-foreground" : "text-foreground")}>
                    <Icon className="size-3.5" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.description}</span>
                    <span className="text-[11px] text-muted-foreground/80">{formatRelative(n.at)}</span>
                  </span>
                  {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-[var(--gs-color-info-base)]" aria-label="Sin leer" />}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem asChild className="justify-center rounded-none py-2.5 text-sm font-medium">
          <Link href="/notificaciones">Ver todas y preferencias</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
