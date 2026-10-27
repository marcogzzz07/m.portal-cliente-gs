"use client"

import { DemoPanel } from "./demo-panel"

/** Franja superior del prototipo: recuerda que los datos son ficticios y da acceso a los controles de la demo. */
export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-[var(--gs-color-warning-subtle)] px-4 py-1 text-center text-xs text-[var(--gs-color-warning-foreground)]">
      <span>
        Datos ficticios<span className="hidden sm:inline"> para demostración</span>
      </span>
      <span aria-hidden>·</span>
      <DemoPanel />
    </div>
  )
}
