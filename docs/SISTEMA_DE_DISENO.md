# Sistema de diseño del Portal de Clientes

El portal de clientes usa el mismo sistema visual que el Portal GS interno
(`portal-gs`, rama `design/mi-gs-propuesta-1`, manual `docs/GS_DESIGN_SYSTEM.md`):
tokens, temas, tipografía y kit de tarjetas. Este documento registra qué se tomó
de allá, qué se adaptó y en qué difiere el portal de clientes.

Solo se cambió la presentación. Datos, permisos, `useScopedData()`, el estado de
la demo y la lógica de cada pantalla quedan igual. No se agregaron dependencias.

## Origen de cada pieza

| Pieza | Portal GS | Portal de clientes |
|---|---|---|
| Tokens (color, tipografía, espaciado, radios, sombras) | `src/styles/gs-tokens.css` | `src/styles/gs-tokens.css`: copia sin la paleta Alternativo (navy) |
| Tema, barra lateral, selector y kit ejecutivo | `gs-theme.css` + partes de `gs-foundations.css` | `src/styles/gs-theme.css`: solo las clases que se usan aquí |
| Mecanismo de tema | `src/lib/ui/theme.ts` | `src/lib/ui/theme.ts`: solo Claro y Oscuro |
| Selector de tema | `src/components/app/ThemeToggle.tsx` | `src/components/layout/theme-toggle.tsx` |
| Gráficas | `src/components/charts/chartStandard.tsx` | `src/components/charts/chart-standard.tsx`: copia con las clases escritas a mano |
| Kit ejecutivo | `src/components/ui/Executive.tsx` | `src/components/shared/executive.tsx`: `StatStrip`, `InsightList`, `Callout`, `ListHeading` y `Meter` |
| Kit de tarjetas | `src/features/mi-gs/ui/mockup.tsx` | Aplicado en los componentes compartidos de este repo (ver abajo) |

## Fundamentos

- **Tipografía:** Inter (pesos 400, 500, 600 y 700) con `next/font` en `src/app/layout.tsx`, expuesta como `--font-inter`. Sustituye a Figtree.
  - Títulos de página de 24 px, cifras KPI de 26 px, títulos de tarjeta de 16 px, cuerpo de 14 px, tablas y controles de 13 px y metadata de 12 px.
  - Ya no hay textos de 10 px: subieron a 11 px.
- **Conexión con shadcn:** en `src/app/globals.css`, las variables de shadcn (`--background`, `--card`, `--primary`, `--border`…) apuntan a los tokens GS.
  - Botones, menús, ventanas, selectores y campos cambian solos con el tema.
  - `--radius` es 0.375rem: 6 px en controles (`rounded-lg`) y unos 8 px en tarjetas (`rounded-xl`).
- **Color:** canvas `#ECEEF0`, tarjetas blancas con borde `#DCDEE1` y sin sombra. La acción principal es grafito `#151618`.
  - El rojo GS `#B92D32` se usa solo para marca, página activa, selección, foco y el indicador de pestaña.
  - Los estados usan sus familias: verde `#06915F`, ámbar ocre `#B7791F`, rojo `#D01C29` e info azul marino `#23477E`, cada una con fondo tenue y texto accesible.
  - Ya no se derivan tonos con opacidad (`bg-success/12`, `bg-destructive/10`…).
- **Superficies:** tarjeta = `rounded-[var(--gs-radius-lg)] border bg-card`, sin sombra. La sombra queda para menús (`--gs-shadow-overlay`), ventanas (`--gs-shadow-modal`) y el hover de tarjetas que son enlace.
- **Elevación y movimiento:** las ventanas y hojas laterales ya no desenfocan el fondo; su capa es negro al 30 %. Los botones ya no se hunden al presionarlos y las imágenes no se agrandan al pasar el cursor. Las flechas de "Continuar" se mueven 4 px.

## Temas Claro y Oscuro

- Solo **Claro** y **Oscuro**. El tema Alternativo (navy) del Portal GS no se incluye en el portal de clientes (decisión de Marco, 27 oct 2026).
- **Cómo se guarda:** el tema vive en `localStorage` (`gs:theme`) y se aplica como `data-theme` en `<html>`.
  - Un script en línea del layout lo aplica antes de pintar, sin destello.
  - La variante `dark:` de Tailwind sigue a `data-theme="dark"`, no a la clase `.dark`.
- **Selector:** va en el pie de la barra lateral. Expandida es un segmentado Sol · Claro / Luna · Oscuro; colapsada es un botón que alterna.
- **Avisos (Sonner):** siguen el tema del portal, no `next-themes`.
- **Colores fijos en Oscuro:**
  - `bg-white` y `ring-black/…` se traducen a tokens.
  - `gs-keep-light` conserva blanco lo que debe seguir blanco: la hoja de los documentos simulados y el contrato dentro de la firma.
- **Paneles grafito:** la bienvenida de Inicio, el contacto principal de Equipo y la barra de la firma usan `.gs-panel-strong`. En Oscuro se invierten a gris claro con texto oscuro.

## Barra lateral

- **Forma:** tarjeta flotante en escritorio, con 12 px de margen arriba, abajo y a la izquierda, contorno de 1 px, esquinas de 16 px y sombra suave. Mide 260 px expandida y 75 px colapsada. En móvil, la hoja abierta va de orilla a orilla.
- **Claro:** vidrio. Blanco al 62 % con desenfoque de 22 px sobre un degradado muy tenue de rojo GS arriba y navy abajo.
- **Oscuro:** grafito `#121315`.
- **Página activa:** bloque rojo GS con texto blanco semibold y una línea blanca de 3 px a la izquierda.
- **Grupos:** separados por una línea fina. Las etiquetas ("Administración", "Próximas fases") van en minúsculas normales, a 12 px.
- **Conteos de Pendientes y Mensajes:** número neutro con contorno, ya no una pastilla roja. Colapsada, un punto gris con el conteo en el nombre accesible.
- **Pie:** selector de tema, fila Salir y, hasta abajo, la tarjeta de perfil.
  - La tarjeta lleva un ícono de persona en cuadro, nombre, rol y el indicador de opciones (`ChevronsUpDown`).
  - Abre el mismo menú de antes: perfil, preferencias, "Ver como…" y cerrar sesión.

## Componentes compartidos

- **`PageHeader`** (`MgPageHeader`): ícono de 40 px, título de 24 px bold, badge con contorno y descripción.
  - El ícono es gris neutro, no violeta: aquí el color queda solo para estados.
  - La ceja ya no va en mayúsculas.
- **`SectionCard`** (`MgSectionCard`):
  - 14 px arriba y abajo y 16 px a los lados.
  - Título de 16 px medium con ícono en cuadro gris y descripción de 12 px.
  - `flush` lleva tablas y listas a los bordes; la nueva prop `footer` pega una `StatStrip` abajo.
- **`MetricCard`** (`MgMetricCard`):
  - Padding de 12×16 px, etiqueta de 14 px y cifra de 26 px bold tabular.
  - El pie con `mt-auto` queda alineado en toda la fila.
  - Con `href`, sombra suave y flecha al pasar el cursor.
  - El ícono va en cuadro **gris neutro** (decisión de Marco); la prop `accent` se conserva pero ya no colorea.
  - Nueva prop `trend` para una `ChartDelta`.
- **`StatusBadge`** (`MgBadge`): pastilla de 12 px con los tonos semánticos de los tokens. Sin punto: la palabra y el tono ya comunican el estado.
- **`Segmented`:** el activo va en grafito con texto inverso (`chartSwitch`). Mide 32 px de alto.
- **Pestañas (`PageTabsList`):** indicador rojo de 2 px y texto activo en semibold neutral. El conteo de cada pestaña va en metadata gris.
- **Selectores (filtros compactos):**
  - Todos usan flechas arriba/abajo (`ChevronsUpDown`).
  - Miden 32 px, con borde sutil, radio de 6 px y texto de 13 px medium.
- **Campos:** fondo de tarjeta; el foco es un borde rojo GS de 2 px efectivos.
- **Botones:**
  - Primario en grafito (gris claro en Oscuro).
  - Secundario (`outline`) sobre canvas, con hover gris.
  - Destructivo sólido rojo con texto blanco.
  - Foco con contorno de 3 px.
- **Tablas:**
  - Encabezado gris de 36 px con etiquetas de 12 px y filas de unos 44 px.
  - Márgenes de 16 px, alineados con el padding de la tarjeta.
  - Hover gris; la fila seleccionada usa el tono de marca tenue.
- **Estado vacío:** recuadro punteado con ícono gris (antes rojo).
- **Avatares:** iniciales sobre grafito (`--gs-color-avatar`). Las personas de GS ya no van en rojo; la etiqueta "GS" las identifica.
- **Contadores de campana y barra inferior móvil:** grafito en lugar de rojo. Lo no leído (notificaciones, novedades) se marca con un punto azul y peso semibold.

## Gráficas

- `chart-standard.tsx` es una copia del estándar del Portal GS:
  - Rejilla horizontal punteada y ejes sin línea, con etiquetas de 12 px.
  - Líneas de 1.5 px sin puntos y barras sólidas de hasta 28 px con 2 px de radio arriba.
  - Etiqueta flotante oscura (`ChartFlyout`), variación en píldora semántica (`ChartDelta`) y leyenda.
- La serie principal va en grafito (`--gs-chart-1`); las comparativas, en grises.
- **Inicio › Indicadores financieros:** barras estándar en grafito. Debajo, una `StatStrip` con Ingresos ene–ago, Septiembre vs. agosto (con `ChartDelta`) y Margen bruto, en pesos sin centavos.

## Pantallas

- **Estructura común:**
  - Contenido a 16 px de las orillas, 16 px entre bloques y ancho máximo de 100 rem.
  - Barra superior de 56 px sin desenfoque.
  - La barra de contexto es una franja compacta con borde.
  - La franja de demo y el aviso de ContaLink usan los tonos ámbar de los tokens.
- **Inicio:**
  - El encabezado pasa a una franja grafito delgada, como "Tu día en GS" del Portal GS: fecha, rol y alcance en una línea, saludo de 22 px y una frase con lo más urgente. Las acciones van a la derecha.
  - Alertas en recuadros de radio de control con tonos semánticos.
  - Las listas Próximas fechas y Lo que hizo GS son más compactas; el tipo de evento ya no lleva punto de color.
  - Las tarjetas de análisis siguen el formato del kit.
- **Pendientes y Documentos:**
  - Búsqueda y filtros viven en una barra dentro de la tarjeta de la tabla, con borde compartido.
  - Las filas de grupo son bandas grises de 12 px semibold.
  - El selector de meses del repositorio es compacto.
- **Calendario:**
  - Los tipos de evento son neutros: gris con su nombre. El color queda para estados.
  - Mes, Semana, Día y Agenda se eligen con un control segmentado.
  - Los filtros por tipo son píldoras con contorno; un tipo apagado se tacha.
  - El encabezado de días ya no va en mayúsculas.
- **Mensajes y Notificaciones:** lo no leído lleva punto azul y semibold. La conversación abierta se marca con el tono de marca tenue. Las burbujas no llevan sombra.
- **Novedades:**
  - "Por qué te importa" va en recuadro gris, como un `Callout`.
  - Las fotos ya no se agrandan al pasar el cursor; la tarjeta toma la sombra suave de los enlaces.
- **Equipo GS:** el contacto principal es un panel grafito. Los rótulos por servicio ya no van en mayúsculas.
- **Contratos, Facturación, Incorporación y Usuarios:** heredan tarjetas, tablas, estados e indicadores; se compactaron paddings y separaciones.
- **Firma simulada:** la barra superior usa el panel grafito y verde de estado. El contrato sigue en hoja blanca con su etiqueta amarilla "Firmar aquí", que imita al proveedor de firma.
- **Documentos simulados:** la hoja conserva su tipografía de documento (incluido el emisor en mayúsculas) y se queda blanca en Oscuro.

## Decisiones de Marco (27 oct 2026)

- Íconos de las tarjetas de indicadores en **gris**, no con el color del Portal GS.
- Barra lateral en tema Claro **igual al Portal GS** (vidrio).
- Solo temas **Claro y Oscuro**; sin Alternativo.
