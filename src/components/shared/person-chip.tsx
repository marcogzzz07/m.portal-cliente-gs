import { getPerson } from "@/data/organization"
import { cn } from "@/lib/utils"
import { UserAvatar } from "./user-avatar"

/** Persona con avatar, nombre y (opcional) puesto. Las personas de GS llevan la etiqueta "GS". */
export function PersonChip({ id, showTitle = false, size = "sm", className }: { id: string; showTitle?: boolean; size?: "sm" | "md"; className?: string }) {
  const p = getPerson(id)
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <UserAvatar firstName={p.firstName} lastName={p.lastName} size={size} highlight={p.org === "gs"} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm">
          {p.firstName} {p.lastName}
          {p.org === "gs" && <span className="ml-1.5 rounded bg-brand-soft px-1 py-px text-[10px] font-semibold text-brand">GS</span>}
        </span>
        {showTitle && <span className="truncate text-xs text-muted-foreground">{p.title}</span>}
      </span>
    </span>
  )
}
