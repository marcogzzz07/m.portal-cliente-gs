import {
  Bell,
  Briefcase,
  CalendarDays,
  FileSignature,
  FolderOpen,
  Home,
  ListChecks,
  MessagesSquare,
  Newspaper,
  Receipt,
  UserCog,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { ModuleKey } from "@/lib/permissions"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  module: ModuleKey
  /** Texto breve de la sección (lo usa el buscador). */
  description: string
  /** Contador dinámico calculado con los datos de la sesión. */
  badge?: "pendientes" | "mensajes"
  /** Fase del prototipo en que se construye. Sin fase = disponible (Fase 1). */
  phase?: 2 | 3
  /** Lo que incluirá la sección cuando se construya (Product Spec). */
  upcoming?: string[]
  /** No aparece en el menú lateral (p. ej. Notificaciones, que se abre desde la campana). */
  hidden?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

const upcomingServicios = [
  "Página por servicio con estado, indicadores, hitos, entregables y equipo responsable",
  "Contabilidad: panorama financiero, estado de resultados, balance y cierre mensual",
  "Impuestos: cumplimiento, obligaciones, estimación conceptual y alertas",
  "Auditoría y proyecto legal: línea de tiempo de hitos y solicitudes de evidencia",
  "Insights con fuente, aprobación de GS y simulador conceptual",
]

/**
 * Menú del portal. Las secciones disponibles van arriba sin etiqueta;
 * las que se construyen en fases posteriores se agrupan en "Próximas fases".
 */
export const navigation: NavSection[] = [
  {
    label: "Portal",
    items: [
      { title: "Inicio", href: "/", icon: Home, module: "inicio", description: "Qué requiere tu atención, panorama y lo que hizo GS." },
      { title: "Pendientes", href: "/pendientes", icon: ListChecks, module: "pendientes", description: "Acciones por atender, enviadas y completadas.", badge: "pendientes" },
      { title: "Calendario", href: "/calendario", icon: CalendarDays, module: "calendario", description: "Obligaciones, reuniones, entregas y vencimientos." },
      { title: "Documentos", href: "/documentos", icon: FolderOpen, module: "documentos", description: "Solicitudes, entregables, versiones y firmados." },
      { title: "Mensajes", href: "/mensajes", icon: MessagesSquare, module: "mensajes", description: "Conversaciones ligadas a documentos, pendientes y proyectos.", badge: "mensajes" },
      { title: "Equipo GS", href: "/equipo", icon: Users, module: "equipo", description: "Tu contacto principal, especialistas y ruta de escalamiento." },
      { title: "Notificaciones", href: "/notificaciones", icon: Bell, module: "notificaciones", description: "Centro de notificaciones y preferencias de recordatorios.", hidden: true },
    ],
  },
  {
    label: "Próximas fases",
    items: [
      { title: "Servicios", href: "/servicios", icon: Briefcase, module: "servicios", description: "Contabilidad, Impuestos, Auditoría y proyectos.", phase: 2, upcoming: upcomingServicios },
      {
        title: "Novedades",
        href: "/novedades",
        icon: Newspaper,
        module: "novedades",
        description: "Novedades fiscales y legales curadas por GS.",
        phase: 2,
        upcoming: ["Contenido aprobado por GS y segmentado por empresa y servicio", "Resumen y “Por qué te importa”", "Acción recomendada ligada a calendario o conversación"],
      },
      {
        title: "Propuestas y contratos",
        href: "/contratos",
        icon: FileSignature,
        module: "contratos",
        description: "Propuestas, contratos y firma electrónica.",
        phase: 3,
        upcoming: ["Propuestas con empresas, alcance, exclusiones y honorarios", "Solicitar aclaración o cambio, aprobar o rechazar", "Firma embebida con DocuSign (simulada) y seguimiento de firmantes", "Onboarding y anticipo al completar la firma"],
      },
      {
        title: "Facturación y pagos",
        href: "/facturacion",
        icon: Receipt,
        module: "facturacion",
        description: "Estado de cuenta, facturas, aclaraciones y pagos.",
        phase: 3,
        upcoming: ["Estado de cuenta consolidado y por empresa (fuente: Odoo)", "Facturas con XML/PDF, notas de crédito y servicio facturado", "Aclaraciones con hilo contextual y fecha esperada de respuesta", "Pago con tarjeta, liga o transferencia (simulado) y carga de comprobante"],
      },
      {
        title: "Usuarios y permisos",
        href: "/usuarios",
        icon: UserCog,
        module: "usuarios",
        description: "Invitaciones, roles y accesos por empresa.",
        phase: 3,
        upcoming: ["Invitar y reenviar invitaciones", "Asignar empresas, servicios y capacidades", "Copiar permisos, suspender o revocar", "Último acceso, estado de MFA y actividad sensible"],
      },
    ],
  },
]

export const navItems = navigation.flatMap((s) => s.items)

/** Sección activa: la de ruta más larga que coincide con la URL actual. */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  return navItems
    .filter((item) => (item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]
}
