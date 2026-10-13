@AGENTS.md

# Portal de Clientes GS — prototipo

- Leer primero `Benchmark_Portal_Clientes_2026.md` y después `Product_Spec_Portal_Clientes.md`.
- Se construye fase por fase (ver README) y se detiene para revisión de Marco al cerrar cada fase.
- Basado en la plantilla Portal GS: respetar tokens de `globals.css`, `PageHeader`, `SectionCard`, `MetricCard` y `StatusBadge`.
- Toda cifra muestra alcance, periodo y fuente (`ScopeNote`). Todo estado lleva palabra, no solo color.
- Toda pantalla consume datos vía `useScopedData()` para respetar rol y contexto (grupo o razón social).
- "Hoy" del prototipo es `DEMO_TODAY` (12 oct 2026). Datos 100 % ficticios; no usar información real de clientes.
- Puerto de desarrollo: 3003.
