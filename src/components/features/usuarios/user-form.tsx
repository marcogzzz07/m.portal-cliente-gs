"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { companies } from "@/data/organization"
import { roles } from "@/lib/permissions"
import type { ClientUser, CompanyId, RoleKey } from "@/lib/types"

export type Access = Pick<ClientUser, "role" | "companies" | "extra">

const capabilityLabels: { key: keyof ClientUser["extra"]; label: string; base: keyof (typeof roles)["admin"]["can"] }[] = [
  { key: "upload", label: "Cargar documentos", base: "upload" },
  { key: "approve", label: "Aprobar cálculos y propuestas", base: "approve" },
  { key: "sign", label: "Firmar en nombre de la empresa", base: "sign" },
  { key: "pay", label: "Pagar facturas", base: "pay" },
]

/** Rol, empresas y capacidades (Product Spec §6: los permisos se restringen por empresa y capacidad). */
export function AccessFields({ value, onChange, copyFrom }: { value: Access; onChange: (v: Access) => void; copyFrom?: ClientUser[] }) {
  const base = roles[value.role].can
  return (
    <div className="grid gap-5">
      {copyFrom && copyFrom.length > 0 && (
        <div className="grid gap-1.5">
          <Label>Copiar permisos de</Label>
          <Select
            value=""
            onValueChange={(id) => {
              const u = copyFrom.find((x) => x.id === id)
              if (u) onChange({ role: u.role, companies: [...u.companies], extra: { ...u.extra } })
            }}
          >
            <SelectTrigger className="w-full data-[size=default]:h-10">
              <SelectValue placeholder="Elige un usuario existente (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {copyFrom.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} · {roles[u.role].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label>Rol</Label>
        <Select value={value.role} onValueChange={(r) => onChange({ ...value, role: r as RoleKey, extra: {} })}>
          <SelectTrigger className="w-full data-[size=default]:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(roles) as RoleKey[]).map((r) => (
              <SelectItem key={r} value={r}>
                {roles[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{roles[value.role].description}</p>
      </div>

      <div className="grid gap-2">
        <Label>Empresas a las que tendrá acceso</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {companies.map((c) => (
            <label key={c.id} className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm">
              <Checkbox
                checked={value.companies.includes(c.id)}
                onCheckedChange={(v) => onChange({ ...value, companies: v ? [...value.companies, c.id as CompanyId] : value.companies.filter((x) => x !== c.id) })}
              />
              {c.name}
            </label>
          ))}
        </div>
        {value.companies.length === 0 && <p className="text-xs text-destructive">Elige al menos una empresa.</p>}
      </div>

      <div className="grid gap-2">
        <Label>Capacidades</Label>
        <div className="divide-y rounded-xl border">
          {capabilityLabels.map((c) => {
            const fromRole = base[c.base]
            const on = fromRole || Boolean(value.extra[c.key])
            return (
              <div key={c.key} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span>
                  {c.label}
                  {fromRole && <span className="ml-2 text-xs text-muted-foreground">incluida en el rol</span>}
                </span>
                <Switch checked={on} disabled={fromRole} onCheckedChange={(v) => onChange({ ...value, extra: { ...value.extra, [c.key]: v } })} aria-label={c.label} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
