@AGENTS.md

# Portal de Clientes GS — prototipo

- Leer primero `Benchmark_Portal_Clientes_2026.md` y después `Product_Spec_Portal_Clientes.md`.
- Se construye fase por fase (ver README) y se detiene para revisión de Marco al cerrar cada fase.
- Usa el sistema visual del Portal GS (ver `docs/SISTEMA_DE_DISENO.md`): respetar tokens de `src/styles/gs-tokens.css`, temas Claro/Oscuro, `PageHeader`, `SectionCard`, `MetricCard` y `StatusBadge`. Documentar ahí todo cambio visual.
- Estilo pedido por Marco (igual a sus módulos de Contraloría): minimalista, sin raya de color lateral en tarjetas, sin espacio muerto, filas de 4 `MetricCard` parejas, tablas amplias dentro de `SectionCard flush`, bloques lado a lado con la misma altura, pocos chips y avatares.
- Toda cifra muestra alcance (tarjeta `ContextBar` arriba de cada página), periodo y fuente (helper o descripción de la tarjeta). Todo estado lleva palabra, no solo color.
- Toda pantalla consume datos vía `useScopedData()` para respetar rol y contexto (grupo o razón social).
- "Hoy" del prototipo es `DEMO_TODAY` (12 oct 2026). Datos 100 % ficticios; no usar información real de clientes.
- Puerto de desarrollo: 3003.
