"use client"

import Link from "next/link"
import { Bell, Check, ChevronsUpDown, LogOut, ShieldCheck, UserRound } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/shared/user-avatar"
import { getPerson, personas } from "@/data/organization"
import { roles } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { usePortal } from "@/store/portal-store"

/** Usuario actual en la parte inferior del sidebar, con cambio de usuario simulado. */
export function SidebarUser({ collapsed = false }: { collapsed?: boolean }) {
  const { persona, setPersona } = usePortal()
  const { firstName, lastName, email, title } = getPerson(persona.personId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-xl py-2 text-left transition-colors outline-none hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed ? "justify-center px-0" : "px-2"
        )}
        aria-label={`${firstName} ${lastName}, ${roles[persona.role].label}`}
      >
        <UserAvatar firstName={firstName} lastName={lastName} highlight />
        {!collapsed && (
          <>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-white">
                {firstName} {lastName}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/70">{roles[persona.role].label}</span>
            </span>
            <ChevronsUpDown className="size-4 text-sidebar-foreground/50" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">
            {firstName} {lastName}
          </span>
          <span className="text-xs font-normal text-muted-foreground">{title}</span>
          <span className="text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toast.info("Perfil y seguridad (MFA, sesiones) se construyen en la Fase 3.")}>
          <ShieldCheck />
          Perfil y seguridad
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/notificaciones">
            <Bell />
            Preferencias de notificación
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UserRound />
            Ver como… (simulación)
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64">
            {personas.map((p) => {
              const person = getPerson(p.personId)
              return (
                <DropdownMenuItem key={p.personId} onSelect={() => setPersona(p.personId)} className="items-start">
                  <span className="flex flex-1 flex-col">
                    <span className="text-sm">
                      {person.firstName} {person.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">{roles[p.role].label}</span>
                  </span>
                  {p.personId === persona.personId && <Check className="mt-1" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => toast("Sesión de demostración", { description: "El prototipo no tiene autenticación real." })}>
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
