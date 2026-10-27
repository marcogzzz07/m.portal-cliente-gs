"use client"

import { Moon, Sun } from "lucide-react"

import { useGsTheme } from "@/hooks/use-theme"
import { setTheme, type GsTheme } from "@/lib/ui/theme"

// Selector Claro / Oscuro del pie de la barra lateral (como en el Portal GS).
// Expandido: segmentado de dos opciones con ícono y texto. Colapsado: un botón
// con el ícono del tema actual que pasa al otro y dice a cuál cambia.

const OPTIONS: Array<{ value: GsTheme; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
]

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const theme = useGsTheme()

  if (collapsed) {
    const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[0]
    const next = OPTIONS.find((o) => o.value !== theme) ?? OPTIONS[1]
    const Icon = current.icon
    const label = `Cambiar a tema ${next.label.toLowerCase()}`
    return (
      <button type="button" onClick={() => setTheme(next.value)} aria-label={label} title={label} className="gs-theme-toggle-icon gs-focusable">
        <Icon aria-hidden="true" />
      </button>
    )
  }

  return (
    <div className="gs-theme-toggle" role="radiogroup" aria-label="Tema del portal">
      {OPTIONS.map((option) => {
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={theme === option.value}
            onClick={() => setTheme(option.value)}
            className="gs-theme-toggle-option gs-focusable"
          >
            <Icon aria-hidden="true" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
