"use client"

import Link from "next/link"
import { Bell, Check, ChevronsUpDown, CircleUserRound, LogOut, ShieldCheck, UserRound } from "lucide-react"
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
import { getPerson, personas } from "@/data/organization"
import { roles } from "@/lib/permissions"
import { usePortal } from "@/store/portal-store"

function signOut() {
  toast("Sesión de demostración", { description: "El prototipo no tiene autenticación real." })
}

/**
 * Pie de la barra (como el Portal GS): fila Salir y, hasta abajo, la tarjeta de
 * perfil (ícono de persona, nombre y rol) que abre las opciones y el cambio de
 * usuario simulado. Colapsada: los mismos accesos como íconos.
 */
export function SidebarUser({ collapsed = false }: { collapsed?: boolean }) {
  const { persona, setPersona } = usePortal()
  const { firstName, lastName, email, title } = getPerson(persona.personId)
  const fullName = `${firstName} ${lastName}`

  return (
    <>
      <button type="button" onClick={signOut} className="gs-sidebar-footer-row gs-focusable mt-1" data-collapsed={collapsed} aria-label={collapsed ? "Salir" : undefined} title={collapsed ? "Salir" : undefined}>
        <LogOut aria-hidden />
        {!collapsed && "Salir"}
      </button>
    <DropdownMenu>
      {collapsed ? (
        <DropdownMenuTrigger className="gs-sidebar-footer-row gs-focusable" data-collapsed="true" aria-label={`Opciones de perfil de ${fullName}`}>
          <CircleUserRound aria-hidden />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger className="gs-sidebar-profile-card gs-focusable mt-2" title={fullName} aria-label={`${fullName}, ${roles[persona.role].label}`}>
          <span className="gs-sidebar-profile-avatar" aria-hidden>
            <CircleUserRound />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] leading-snug font-semibold text-[var(--gs-color-text-inverse)]">{fullName}</span>
            <span className="block truncate text-[11px] text-[var(--gs-color-text-inverse-muted)]">{roles[persona.role].label}</span>
          </span>
          <span className="gs-sidebar-profile-chevron" aria-hidden>
            <ChevronsUpDown />
          </span>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent side={collapsed ? "right" : "top"} align={collapsed ? "end" : "start"} className="w-64">
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
        <DropdownMenuItem variant="destructive" onSelect={signOut}>
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
