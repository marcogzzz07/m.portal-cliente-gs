# Portal de Clientes GS — prototipo navegable

Mockup de alta fidelidad del Portal de Clientes de González Solís, construido por fases sobre la
plantilla de diseño **Portal GS** (mismos colores, tipografía Figtree y componentes). Todos los datos
son ficticios: Grupo EcoPack Norte y sus cinco razones sociales.

Referencias de producto en esta carpeta:

- `Benchmark_Portal_Clientes_2026.md`: patrones de mercado que se adoptan, adaptan o posponen.
- `Product_Spec_Portal_Clientes.md`: qué se construye, cómo se comporta y criterios de aceptación.

## Ver el prototipo

```bash
npm install
npm run dev
```

Abre <http://localhost:3003>. El botón **Demo · Fase 1** del encabezado permite cambiar de usuario
simulado (seis roles), activar respuestas automáticas de GS, simular una caída de ContaLink,
restablecer los datos y ver los 14 recorridos obligatorios con su fase.

Los cambios que hagas (cargas, aprobaciones, mensajes) se guardan solo en tu navegador.

## Fases

| Fase | Alcance | Estado |
|---|---|---|
| 1 · Fundación | Estructura base, selector grupo/empresa, roles simulados, Inicio, Pendientes, Calendario, Documentos, Mensajes, Notificaciones y Equipo GS | Lista para revisión |
| 2 · Servicios y valor | Contabilidad, Impuestos, Auditoría, proyecto legal, dashboards, insights, simulador y Novedades | Pendiente |
| 3 · Relación administrativa | Invitación y MFA, onboarding, propuestas, firma DocuSign simulada, facturación, aclaraciones, pagos y usuarios | Pendiente |

Las secciones de fases posteriores aparecen en el menú con su etiqueta (F2, F3) y describen lo que incluirán.

## Estructura

```text
src/
├── app/(app)/            # Rutas: inicio, pendientes, calendario, documentos, mensajes, notificaciones, equipo
├── components/
│   ├── features/         # Pantallas por módulo
│   ├── layout/           # Sidebar, encabezado, selector de contexto, panel de demo, barra móvil
│   ├── shared/           # Piezas del Portal GS (encabezado, indicadores, estados, alcance de cifras…)
│   └── ui/               # Componentes base shadcn/ui
├── data/                 # Datos ficticios: organización, pendientes, documentos, conversaciones, calendario
├── hooks/use-scoped-data.ts  # Datos visibles según rol y contexto activo
├── lib/
│   ├── permissions.ts    # Roles del Product Spec §6 y reglas de visibilidad
│   ├── status.ts         # Catálogos de estados (siempre con palabra, nunca solo color)
│   └── types.ts          # Modelo de información (Product Spec §7)
└── store/portal-store.tsx    # Estado de la sesión de demo y acciones simuladas
```

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Lucide · Recharts · Sonner.
Sin backend: Supabase y Vercel se incorporarán cuando el producto lo requiera.
