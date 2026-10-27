# Portal de Clientes GS — prototipo navegable

Mockup de alta fidelidad del Portal de Clientes de González Solís, construido por fases sobre la
sistema visual del **Portal GS** (mismos tokens, temas Claro y Oscuro, tipografía Inter y kit de
tarjetas; ver `docs/SISTEMA_DE_DISENO.md`). Todos los datos son ficticios: Grupo EcoPack Norte y sus
cinco razones sociales.

Referencias de producto en esta carpeta:

- `Benchmark_Portal_Clientes_2026.md`: patrones de mercado que se adoptan, adaptan o posponen.
- `Product_Spec_Portal_Clientes.md`: qué se construye, cómo se comporta y criterios de aceptación.

## Ver el prototipo

```bash
npm install
npm run dev
```

Abre <http://localhost:3003>. El enlace **Controles de la demo** de la franja superior permite cambiar de usuario simulado (siete, incluida Carmen, que activa su invitación), activar respuestas automáticas de GS, simular una caída de ContaLink,
restablecer los datos y ver los 14 recorridos obligatorios con su fase.

Los cambios que hagas (cargas, aprobaciones, mensajes) se guardan solo en tu navegador. El tema
Claro / Oscuro se cambia desde el pie de la barra lateral.

## Fases

| Fase | Alcance | Estado |
|---|---|---|
| 1 · Fundación | Estructura base, selector grupo/empresa, roles simulados, Inicio, Pendientes, Calendario, Documentos, Mensajes, Notificaciones y Equipo GS | Lista |
| 1+ · Extras | Repositorio histórico de entregables 2026 con vista previa y descarga (PDF/CSV/XML), agendar reuniones con GS y Novedades con fotos | Lista para revisión |
| 2 · Servicios y valor | Contabilidad, Impuestos y Auditoría alineados al mockup del equipo de BI; insights y simulador | En espera de los entregables de cada servicio |
| 3 · Relación administrativa | Invitación y MFA (`/invitacion`), incorporación de EcoPack Desarrollos, propuesta 2027 con firma simulada, facturación con aclaraciones y pagos, usuarios y permisos | Lista para revisión |

Las secciones de fases posteriores aparecen en el menú con su etiqueta (F2, F3) y describen lo que incluirán.

## Estructura

```text
src/
├── app/(app)/            # Rutas: inicio, pendientes, calendario, documentos, mensajes, notificaciones, equipo
├── styles/               # Tokens y tema del sistema visual GS (gs-tokens.css, gs-theme.css)
├── components/
│   ├── charts/           # Estándar de gráficas del Portal GS
│   ├── features/         # Pantallas por módulo
│   ├── layout/           # Sidebar, encabezado, selector de contexto, panel de demo, barra móvil
│   ├── shared/           # Kit del Portal GS (encabezado, tarjetas, indicadores, estados, kit ejecutivo…)
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

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Lucide · Recharts · Sonner · Inter (next/font).
Sin backend: Supabase y Vercel se incorporarán cuando el producto lo requiera.
