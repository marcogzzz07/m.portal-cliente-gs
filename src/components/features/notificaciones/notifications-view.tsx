"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck, Lock, Mail, MonitorSmartphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs } from "@/components/ui/tabs"
import { CompanyTag } from "@/components/shared/company-tag"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { PageTabsList, PageTabsTrigger } from "@/components/shared/page-tabs"
import { SectionCard } from "@/components/shared/section-card"
import { useScopedData } from "@/hooks/use-scoped-data"
import { formatDateTime, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import { usePortal, type ReminderPrefs } from "@/store/portal-store"
import { notificationIcon, notificationKindLabel } from "./notification-icon"

const prefRows: { key: keyof ReminderPrefs; label: string; description: string }[] = [
  { key: "vencimientos", label: "Vencimientos", description: "Pendientes por vencer y vencidos." },
  { key: "documentos", label: "Documentos", description: "Documentos aceptados o con correcciones." },
  { key: "entregables", label: "Entregables", description: "Cuando GS publica un entregable." },
  { key: "mensajes", label: "Mensajes", description: "Respuestas en tus conversaciones." },
  { key: "facturas", label: "Facturas", description: "Facturas emitidas, por vencer y pagadas." },
  { key: "novedades", label: "Insights y novedades", description: "Análisis y novedades relevantes para tu empresa." },
]

/** Centro de notificaciones y preferencias (Product Spec §21). */
export function NotificationsView() {
  const { state, readNotification, readAllNotifications, setPref } = usePortal()
  const { notifications } = useScopedData()
  const [tab, setTab] = useState<"todas" | "sin-leer">("todas")
  const list = tab === "todas" ? notifications : notifications.filter((n) => !n.read)
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Bell}
        title="Notificaciones"
        description="Cada aviso te lleva directo al pendiente, documento o conversación que lo originó."
        actions={
          <Button variant="outline" onClick={readAllNotifications} disabled={unread === 0}>
            <CheckCheck />
            Marcar todo como leído
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="gap-4">
          <PageTabsList>
            <PageTabsTrigger value="todas">Todas</PageTabsTrigger>
            <PageTabsTrigger value="sin-leer">
              Sin leer
              {unread > 0 && <span className="ml-1.5 text-xs font-normal text-muted-foreground tabular-nums">{unread}</span>}
            </PageTabsTrigger>
          </PageTabsList>
          {list.length === 0 ? (
            <EmptyState icon={CheckCheck} title="Estás al día" description="No tienes notificaciones sin leer." />
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {list.map((n) => {
                const Icon = notificationIcon[n.kind]
                return (
                  <li key={n.id}>
                    <Link href={n.href} onClick={() => readNotification(n.id)} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted">
                      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted", n.read ? "text-muted-foreground" : "text-foreground")}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</span>
                          <span className="rounded bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground">{notificationKindLabel[n.kind]}</span>
                        </span>
                        <span className="block text-sm text-muted-foreground">{n.description}</span>
                        <span className="flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                          <span title={formatDateTime(n.at)}>{formatRelative(n.at)}</span>
                          <CompanyTag companies={n.companies} className="text-[11px]" />
                        </span>
                      </span>
                      {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-[var(--gs-color-info-base)]" aria-label="Sin leer" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Tabs>

        <SectionCard title="Preferencias de recordatorios" description="Tú decides cómo recibir los avisos no obligatorios." icon={MonitorSmartphone}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-2 text-left font-medium">Tipo</th>
                <th className="w-16 pb-2 text-center font-medium">
                  <Bell className="mx-auto size-3.5" aria-hidden />
                  <span className="sr-only">Portal</span>
                </th>
                <th className="w-16 pb-2 text-center font-medium">
                  <Mail className="mx-auto size-3.5" aria-hidden />
                  <span className="sr-only">Correo</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {prefRows.map((r) => (
                <tr key={r.key}>
                  <td className="py-2.5 pr-2">
                    <p className="font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </td>
                  <td className="text-center">
                    <Switch checked={state.prefs[r.key].portal} onCheckedChange={(v) => setPref(r.key, "portal", v)} aria-label={`${r.label} en el portal`} />
                  </td>
                  <td className="text-center">
                    <Switch checked={state.prefs[r.key].email} onCheckedChange={(v) => setPref(r.key, "email", v)} aria-label={`${r.label} por correo`} />
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 pr-2">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Lock className="size-3.5" /> Seguridad y acciones legales
                  </p>
                  <p className="text-xs text-muted-foreground">Inicios de sesión, firmas requeridas y avisos legales. Siempre activos.</p>
                </td>
                <td className="text-center">
                  <Switch checked disabled aria-label="Seguridad en el portal (obligatorio)" />
                </td>
                <td className="text-center">
                  <Switch checked disabled aria-label="Seguridad por correo (obligatorio)" />
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">Las notificaciones push llegarán con la aplicación móvil. Los correos enlazan al elemento exacto dentro del portal.</p>
        </SectionCard>
      </div>
    </div>
  )
}
