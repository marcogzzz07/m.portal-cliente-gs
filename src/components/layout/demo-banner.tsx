"use client"

import { DemoPanel } from "./demo-panel"

/** Franja superior del prototipo: recuerda que los datos son ficticios y da acceso a los controles de la demo. */
export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-[oklch(0.94_0.03_60)] px-4 py-1 text-center text-xs text-[oklch(0.42_0.06_50)]">
      <span>
        Datos ficticios<span className="hidden sm:inline"> para demostración · Fase 1</span>
      </span>
      <span aria-hidden>·</span>
      <DemoPanel />
    </div>
  )
}
