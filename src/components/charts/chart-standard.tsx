"use client";

// Copiado del Portal GS interno (src/components/charts/chartStandard.tsx, rama
// design/mi-gs-propuesta-1). Único cambio: las recetas de gsVisual se escriben
// como clases porque este repo no tiene gsVisualSystem.ts. Ver "Gráficas" en
// docs/SISTEMA_DE_DISENO.md.

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { TooltipPayload } from "recharts";
import { cn } from "@/lib/utils";

// Estándar visual de las gráficas de líneas y barras del portal (recharts).
// Toda gráfica nueva o existente toma de aquí ejes, grid, trazos y etiqueta
// flotante para que se vean iguales en todos los módulos.
// Dirección ejecutiva: serie principal en grafito, comparativas en grises,
// grid punteado, tooltip oscuro y cifra principal con variación arriba.

// ── Marco: margen, grid y ejes ──────────────────────────────────────────────

export const CHART_MARGIN = { top: 12, right: 12, bottom: 0, left: 0 };

/** Solo líneas horizontales, punteadas y tenues. */
export const chartGridProps = {
  stroke: "var(--gs-chart-grid)",
  strokeDasharray: "3 4",
  vertical: false,
};

const chartTick = { fontSize: 12, fill: "var(--gs-color-text-muted)" };

/** Ejes sin línea ni marcas: solo las etiquetas. */
export const chartXAxisProps = {
  axisLine: false,
  tickLine: false,
  tick: chartTick,
  tickMargin: 8,
};

export const chartYAxisProps = {
  axisLine: false,
  tickLine: false,
  tick: chartTick,
  width: 56,
};

/**
 * Eje Y de las líneas: se acerca al rango de los datos (no arranca en 0) y
 * usa 5 marcas redondeadas, para que las líneas no se vean encimadas. Las
 * barras usan `chartYAxisProps`, porque una barra siempre mide desde 0.
 */
export const lineChartYAxisProps = {
  ...chartYAxisProps,
  domain: ["auto", "auto"],
  tickCount: 5,
};

// ── Series de líneas ────────────────────────────────────────────────────────

type SolidCircle = {
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

export type LineSeriesStyle = {
  type: "monotone";
  stroke: string;
  strokeWidth: number;
  /** Solo las series de referencia lo usan, para verse más apagadas. */
  strokeOpacity?: number;
  dot: false;
  activeDot: SolidCircle;
};

/** Opacidad de las series de referencia; su leyenda usa la misma. */
const SECONDARY_SERIES_OPACITY = 0.6;

type AreaSeriesStyle = LineSeriesStyle & {
  fill: string;
  fillOpacity: number;
};

/** Punto sólido con halo blanco que aparece solo bajo el cursor. */
function activeCircle(color: string, r: number): SolidCircle {
  return {
    r,
    fill: color,
    stroke: "var(--gs-color-surface-elevated)",
    strokeWidth: 2,
  };
}

/**
 * Curva suave y delgada (1.5px, estilo analítico) sin puntos; el punto
 * aparece solo al pasar el cursor.
 */
export function getLineSeriesStyle(color: string): LineSeriesStyle {
  return {
    type: "monotone",
    stroke: color,
    strokeWidth: 1.5,
    dot: false,
    activeDot: activeCircle(color, 4),
  };
}

/**
 * Serie de referencia junto a una principal (p. ej. años anteriores contra el
 * actual): línea más delgada y color atenuado.
 */
export function getSecondaryLineSeriesStyle(color: string): LineSeriesStyle {
  return {
    type: "monotone",
    stroke: color,
    strokeWidth: 1.25,
    strokeOpacity: SECONDARY_SERIES_OPACITY,
    dot: false,
    activeDot: activeCircle(color, 3.5),
  };
}

/**
 * La misma línea con un degradado debajo que se desvanece hacia el eje. Solo
 * para gráficas de una serie: con varias se usa `getLineSeriesStyle`. El
 * degradado se declara dentro de la gráfica con `renderAreaGradient`.
 */
export function getAreaSeriesStyle(
  color: string,
  gradientId: string,
): AreaSeriesStyle {
  return {
    ...getLineSeriesStyle(color),
    fill: `url(#${gradientId})`,
    fillOpacity: 1,
  };
}

/** `<defs>` del degradado de `getAreaSeriesStyle`; va como hijo de la gráfica. */
export function renderAreaGradient(gradientId: string, color: string) {
  return (
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.12} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

/** Guía vertical punteada sobre el mes que está bajo el cursor. */
export const lineChartCursor = {
  stroke: "var(--gs-color-border-control)",
  strokeWidth: 1,
  strokeDasharray: "4 4",
};

// ── Series de barras ────────────────────────────────────────────────────────

type BarSeriesStyle = {
  fill: string;
  maxBarSize: number;
  radius: [number, number, number, number];
};

/** Columna sólida, casi recta (2px arriba), sin riel detrás. */
export function getBarSeriesStyle(color: string): BarSeriesStyle {
  return {
    fill: color,
    maxBarSize: 28,
    radius: [2, 2, 0, 0],
  };
}

/** Banda tenue detrás de la columna que está bajo el cursor. */
export const barChartCursor = {
  fill: "var(--gs-color-surface-hover)",
  radius: 2,
};

// ── Etiqueta flotante (tooltip) ─────────────────────────────────────────────

type ChartFlyoutProps = {
  // recharts inyecta `active`, `label` y `payload` al clonar el elemento.
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayload;
  valueFormatter: (value: number) => string;
  labelFormatter?: (label: string) => string;
  /**
   * Las series llegan en el orden en que se dibujan. Con `true` se listan al
   * revés (p. ej. la serie dibujada al final, encima, aparece primero).
   */
  reverseEntries?: boolean;
};

/** Superficie oscura de los tooltips de gráficas (también para flyouts propios). */
export const chartFlyoutSurface =
  "rounded-[var(--gs-radius-md)] bg-[var(--gs-color-surface-inverse)] px-3 py-2 text-xs text-[color:var(--gs-color-text-inverse-muted)] shadow-[var(--gs-shadow-tooltip)]";

/** Texto destacado dentro de `chartFlyoutSurface`. */
export const chartFlyoutStrong =
  "font-semibold text-[color:var(--gs-color-text-inverse)]";

/**
 * Tarjeta flotante oscura con el mes arriba y el valor de cada serie. Con una
 * sola serie muestra solo el valor; con varias agrega el color y el nombre.
 */
export function ChartFlyout({
  active,
  label,
  payload,
  valueFormatter,
  labelFormatter,
  reverseEntries = false,
}: ChartFlyoutProps) {
  if (!active || !payload) return null;

  const entriesWithValue = payload.filter(
    (entry) => entry.value !== null && entry.value !== undefined,
  );
  if (entriesWithValue.length === 0) return null;
  if (reverseEntries) entriesWithValue.reverse();

  const showSeriesNames = entriesWithValue.length > 1;
  const labelText = labelFormatter
    ? labelFormatter(String(label ?? ""))
    : String(label ?? "");

  return (
    <div className={cn(chartFlyoutSurface, "min-w-[112px]")}>
      <p>{labelText}</p>
      <ul className="mt-1 space-y-1">
        {entriesWithValue.map((entry) => (
          <li
            key={String(entry.dataKey ?? entry.name)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {showSeriesNames ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}</span>
              </>
            ) : null}
            <span
              className={cn(
                "ml-auto",
                chartFlyoutStrong,
                "tabular-nums lining-nums",
              )}
            >
              {valueFormatter(Number(entry.value))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Leyenda ─────────────────────────────────────────────────────────────────

export type ChartLegendItem = {
  label: string;
  color: string;
  /** Línea punteada para series de referencia (p. ej. un avance esperado). */
  dashed?: boolean;
  /** Serie dibujada con `getSecondaryLineSeriesStyle`. */
  secondary?: boolean;
  /** Dato corto después del nombre, p. ej. la variación contra el año anterior. */
  trailing?: ReactNode;
};

function LegendSwatch({ item }: { item: ChartLegendItem }) {
  if (item.secondary) {
    return (
      <span
        aria-hidden="true"
        className="h-0.5 w-6"
        style={{
          backgroundColor: item.color,
          opacity: SECONDARY_SERIES_OPACITY,
        }}
      />
    );
  }

  if (item.dashed) {
    return (
      <span
        aria-hidden="true"
        className="w-6 border-t-2 border-dashed"
        style={{ borderColor: item.color }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="h-0.5 w-6"
      style={{ backgroundColor: item.color }}
    />
  );
}

// ── Cifra principal ─────────────────────────────────────────────────────────

/** Qué dirección de cambio es buena: ingresos suben, cartera vencida baja. */
export type ChartDeltaPolarity = "higher-is-better" | "lower-is-better";

type ChartPoint = { label: string; value: number };

/**
 * Último punto, el anterior y la variación entre ambos (fracción, 0.05 = 5%).
 * Sin punto anterior o con base 0 la variación es `null`.
 */
export function getLastPeriodChange(points: ChartPoint[]) {
  const last = points.at(-1) ?? null;
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const delta =
    last && previous && previous.value !== 0
      ? (last.value - previous.value) / Math.abs(previous.value)
      : null;

  return { last, previous, delta };
}

const deltaFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

/** Pill semántica con flecha: verde si el cambio es favorable, rojo si no. */
export function ChartDelta({
  delta,
  polarity = "higher-is-better",
}: {
  delta: number;
  polarity?: ChartDeltaPolarity;
}) {
  const isUp = delta >= 0;
  const isFavorable = polarity === "higher-is-better" ? isUp : !isUp;
  const Arrow = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        "tabular-nums lining-nums",
        isFavorable
          ? "bg-[var(--gs-color-success-subtle)] text-[color:var(--gs-color-success-foreground)]"
          : "bg-[var(--gs-color-danger-subtle)] text-[color:var(--gs-color-danger-foreground)]",
      )}
    >
      <Arrow aria-hidden="true" className="h-3.5 w-3.5" />
      {deltaFormatter.format(Math.abs(delta) * 100)}%
    </span>
  );
}

/**
 * Lectura ejecutiva encima de la gráfica: el valor del último periodo en
 * tamaño KPI, su variación contra el periodo anterior y de qué meses se trata.
 */
export function ChartHeadline({
  points,
  valueFormatter,
  polarity,
}: {
  points: ChartPoint[];
  valueFormatter: (value: number) => string;
  polarity?: ChartDeltaPolarity;
}) {
  const { last, previous, delta } = getLastPeriodChange(points);
  if (!last) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="text-[1.625rem] leading-tight font-bold tracking-tight tabular-nums">
        {valueFormatter(last.value)}
      </p>
      {delta !== null ? <ChartDelta delta={delta} polarity={polarity} /> : null}
      <p className={"text-xs text-[color:var(--gs-color-text-muted)]"}>
        {previous ? `${last.label} vs ${previous.label}` : last.label}
      </p>
    </div>
  );
}

export function ChartLegend({ items }: { items: ChartLegendItem[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-4">
      {items.map((item) => (
        <li
          key={item.label}
          className={cn(
            "text-xs text-[color:var(--gs-color-text-muted)]",
            "flex items-center gap-2",
          )}
        >
          <LegendSwatch item={item} />
          {item.label}
          {item.trailing}
        </li>
      ))}
    </ul>
  );
}
