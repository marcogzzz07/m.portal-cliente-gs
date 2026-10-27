"use client"

import { useState } from "react"
import Link from "next/link"
import { Ban, Mail, MoreHorizontal, RotateCcw, ShieldAlert, ShieldCheck, UserCog, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AccessDenied } from "@/components/shared/access-denied"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { formatDate, formatDateTime, formatRelative } from "@/lib/format"
import { companiesLabel } from "@/lib/labels"
import { canAccessModule, roles } from "@/lib/permissions"
import { userStatus } from "@/lib/status"
import type { ClientUser } from "@/lib/types"
import { useAdmin } from "@/store/admin-store"
import { usePortal } from "@/store/portal-store"
import { AccessFields, type Access } from "./user-form"

/** Administración de usuarios (Product Spec §20): invitar, permisos por empresa, suspender y actividad sensible. */
export function UsersView() {
  const { persona } = usePortal()
  const { state, inviteUser, updateUser } = useAdmin()
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState<ClientUser | null>(null)

  if (!canAccessModule(persona, "usuarios")) return <AccessDenied description="Solo los administradores de tu empresa pueden gestionar usuarios." />

  const users = state.users
  const active = users.filter((u) => u.status === "activo")
  const withMfa = active.filter((u) => u.mfa !== "pendiente").length

  return (
    <div className="space-y-4">
      <PageHeader
        icon={UserCog}
        title="Usuarios y permisos"
        description="Invita a personas de tu empresa y define qué empresas ven y qué pueden hacer. GS conserva la capacidad de revocar accesos."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus />
            Invitar usuario
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Usuarios activos" value={active.length} icon={Users} accent="blue" helper="Con acceso al portal" />
        <MetricCard label="Invitaciones pendientes" value={users.filter((u) => u.status === "invitado").length} icon={Mail} accent="amber" helper="Vencen a los 7 días" />
        <MetricCard label="Con MFA" value={`${withMfa} de ${active.length}`} icon={ShieldCheck} accent="green" helper="Obligatorio para todos" />
        <MetricCard label="Suspendidos" value={users.filter((u) => u.status === "suspendido").length} icon={Ban} accent="pink" helper="Sin acceso, historial conservado" />
      </div>

      <div className="overflow-hidden rounded-xl bg-card border">
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Empresas</TableHead>
              <TableHead>MFA</TableHead>
              <TableHead>Último acceso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-0" aria-label="Acciones" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="cursor-pointer" onClick={() => setEditing(u)}>
                <TableCell>
                  <span className="flex items-center gap-3">
                    <UserAvatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {u.firstName} {u.lastName}
                        {u.personId === persona.personId && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(tú)</span>}
                      </span>
                      <span className="block text-[13px] text-muted-foreground">{u.email}</span>
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{roles[u.role].label}</TableCell>
                <TableCell className="text-muted-foreground">{u.companies.length === 5 ? "Todas" : companiesLabel(u.companies)}</TableCell>
                <TableCell className="text-muted-foreground">{u.mfa === "app" ? "App" : u.mfa === "sms" ? "SMS" : "Pendiente"}</TableCell>
                <TableCell className="text-muted-foreground">{u.lastAccess ? formatRelative(u.lastAccess) : u.status === "invitado" ? `Vence ${formatDate(u.expiresAt!)}` : "—"}</TableCell>
                <TableCell>
                  <StatusBadge {...userStatus[u.status]} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowMenu user={u} onEdit={() => setEditing(u)} self={u.personId === persona.personId} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ul className="divide-y md:hidden">
          {users.map((u) => (
            <li key={u.id}>
              <button type="button" onClick={() => setEditing(u)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                <UserAvatar firstName={u.firstName} lastName={u.lastName} size="md" />
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block font-medium">
                    {u.firstName} {u.lastName}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">{roles[u.role].label}</span>
                </span>
                <StatusBadge {...userStatus[u.status]} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <SectionCard title="Actividad sensible" description="Accesos, invitaciones, descargas, pagos y firmas" icon={ShieldAlert} flush>
        <Table>
          <TableBody>
            {state.audit.slice(0, 8).map((a) => (
              <TableRow key={a.id}>
                <TableCell className="w-40 text-muted-foreground tabular-nums">{formatDateTime(a.at)}</TableCell>
                <TableCell className="font-medium">{a.actor}</TableCell>
                <TableCell>{a.action}</TableCell>
                <TableCell className="max-w-0 truncate text-muted-foreground">{a.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        users={users}
        onInvite={(u) => {
          inviteUser(u)
          toast.success(`Invitación enviada a ${u.email}`, { description: "Vence en 7 días. Puedes reenviarla o revocarla desde la tabla." })
        }}
      />
      {editing && (
        <EditSheet
          user={state.users.find((u) => u.id === editing.id) ?? editing}
          onClose={() => setEditing(null)}
          onSave={(access) => {
            updateUser(editing.id, access, "Cambió permisos")
            toast.success("Permisos actualizados")
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function RowMenu({ user, onEdit, self }: { user: ClientUser; onEdit: () => void; self: boolean }) {
  const { updateUser } = useAdmin()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${user.firstName}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={onEdit}>
          <UserCog />
          Editar permisos
        </DropdownMenuItem>
        {user.status === "invitado" && (
          <>
            <DropdownMenuItem
              onSelect={() => {
                updateUser(user.id, { expiresAt: "2026-10-19", invitedAt: "2026-10-12T09:00" }, "Reenvió una invitación")
                toast.success("Invitación reenviada")
              }}
            >
              <Mail />
              Reenviar invitación
            </DropdownMenuItem>
            {user.id === "U-carmen" && (
              <DropdownMenuItem asChild>
                <Link href="/invitacion">
                  <ShieldCheck />
                  Ver la invitación (demo)
                </Link>
              </DropdownMenuItem>
            )}
          </>
        )}
        {!self && <DropdownMenuSeparator />}
        {!self && user.status === "activo" && (
          <DropdownMenuItem
            onSelect={() => {
              updateUser(user.id, { status: "suspendido" }, "Suspendió a un usuario")
              toast("Usuario suspendido", { description: "Sus sesiones activas se cerraron." })
            }}
          >
            <Ban />
            Suspender
          </DropdownMenuItem>
        )}
        {!self && user.status === "suspendido" && (
          <DropdownMenuItem
            onSelect={() => {
              updateUser(user.id, { status: "activo" }, "Reactivó a un usuario")
              toast.success("Usuario reactivado")
            }}
          >
            <RotateCcw />
            Reactivar
          </DropdownMenuItem>
        )}
        {!self && user.status !== "revocado" && (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              updateUser(user.id, { status: "revocado" }, "Revocó un acceso")
              toast("Acceso revocado", { description: "El historial del usuario se conserva." })
            }}
          >
            <Ban />
            {user.status === "invitado" ? "Cancelar invitación" : "Revocar acceso"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function InviteDialog({ open, onOpenChange, users, onInvite }: { open: boolean; onOpenChange: (v: boolean) => void; users: ClientUser[]; onInvite: (u: Omit<ClientUser, "id" | "status" | "mfa" | "invitedAt" | "invitedBy" | "expiresAt">) => void }) {
  const [person, setPerson] = useState({ firstName: "", lastName: "", email: "", title: "" })
  const [access, setAccess] = useState<Access>({ role: "consulta", companies: [], extra: {} })
  const valid = person.firstName.trim() && person.lastName.trim() && /\S+@\S+\.\S+/.test(person.email) && access.companies.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
          <DialogDescription>Recibirá un correo con un enlace personal que vence en 7 días. Al activarlo creará su contraseña y configurará MFA.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="inv-first">Nombre</Label>
              <Input id="inv-first" value={person.firstName} onChange={(e) => setPerson({ ...person, firstName: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="inv-last">Apellido</Label>
              <Input id="inv-last" value={person.lastName} onChange={(e) => setPerson({ ...person, lastName: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="inv-email">Correo</Label>
              <Input id="inv-email" type="email" value={person.email} onChange={(e) => setPerson({ ...person, email: e.target.value })} placeholder="nombre@ecopack.ejemplo.mx" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="inv-title">Puesto</Label>
              <Input id="inv-title" value={person.title} onChange={(e) => setPerson({ ...person, title: e.target.value })} placeholder="Ej. Analista de tesorería" />
            </div>
          </div>
          <AccessFields value={access} onChange={setAccess} copyFrom={users.filter((u) => u.status === "activo")} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onInvite({ ...person, ...access })
              setPerson({ firstName: "", lastName: "", email: "", title: "" })
              setAccess({ role: "consulta", companies: [], extra: {} })
              onOpenChange(false)
            }}
          >
            <Mail />
            Enviar invitación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditSheet({ user, onClose, onSave }: { user: ClientUser; onClose: () => void; onSave: (a: Access) => void }) {
  const [access, setAccess] = useState<Access>({ role: user.role, companies: [...user.companies], extra: { ...user.extra } })
  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-3">
            <UserAvatar firstName={user.firstName} lastName={user.lastName} size="lg" />
            <div>
              <SheetTitle>
                {user.firstName} {user.lastName}
              </SheetTitle>
              <SheetDescription>
                {user.title} · {user.email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="space-y-6 p-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="font-medium">{userStatus[user.status].label}</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs text-muted-foreground">MFA</p>
              <p className="font-medium">{user.mfa === "app" ? "App autenticadora" : user.mfa === "sms" ? "SMS" : "Pendiente"}</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs text-muted-foreground">Último acceso</p>
              <p className="font-medium">{user.lastAccess ? formatRelative(user.lastAccess) : "—"}</p>
            </div>
          </div>
          <AccessFields value={access} onChange={setAccess} />
          {user.status === "activo" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Sesiones activas</p>
              <ul className="divide-y rounded-xl border text-sm">
                <li className="flex justify-between px-3 py-2.5">
                  <span>Chrome · macOS · Monterrey</span>
                  <span className="text-muted-foreground">Ahora</span>
                </li>
                <li className="flex justify-between px-3 py-2.5">
                  <span>Safari · iPhone</span>
                  <span className="text-muted-foreground">Hace 2 días</span>
                </li>
              </ul>
            </div>
          )}
        </div>
        <SheetFooter className="border-t">
          <Button disabled={access.companies.length === 0} onClick={() => onSave(access)}>
            Guardar permisos
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
