"use client"

import { cn } from "@/lib/utils"

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  label: string
  className?: string
}

/** Selector segmentado (p. ej. "Por mes · Por trimestre"), con el `chartSwitch` del Portal GS. */
export function Segmented<T extends string>({ value, onChange, options, label, className }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex h-8 items-center gap-0.5 rounded-lg border bg-card p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-full rounded-[calc(var(--gs-radius-md)-2px)] px-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
            // Activo en grafito con texto inverso (chartSwitch del Portal GS): selección neutral, no de marca.
            value === o.value && "bg-primary text-primary-foreground hover:text-primary-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
