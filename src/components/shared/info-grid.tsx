import { cn } from "@/lib/utils"

export interface InfoItem {
  label: string
  value: React.ReactNode
}

/** Lista de pares etiqueta/valor en rejilla (fichas de perfil, detalles). */
export function InfoGrid({ items, columns = 2, className }: { items: InfoItem[]; columns?: 1 | 2 | 3; className?: string }) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 space-y-1">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="truncate text-sm font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
