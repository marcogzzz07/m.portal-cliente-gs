import { cn } from "@/lib/utils"

/** Marca de alcance del prototipo: indica en qué fase se construye una sección. */
export function PhaseBadge({ phase, compact = false, className }: { phase: 2 | 3; compact?: boolean; className?: string }) {
  return (
    <span title={`Se construye en la Fase ${phase} del prototipo`} className={cn("shrink-0 rounded-full border border-dashed border-current/40 px-1.5 py-px text-[11px] font-medium opacity-70", className)}>
      {compact ? `F${phase}` : `Fase ${phase}`}
    </span>
  )
}
