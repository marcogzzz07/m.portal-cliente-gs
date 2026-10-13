"use client"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

/** Pestañas de página estilo Portal GS: subrayado y texto en rojo al estar activas. */
export function PageTabsList({ className, ...props }: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      variant="line"
      className={cn("h-auto! w-full justify-start gap-0 overflow-x-auto border-b border-border p-0", className)}
      {...props}
    />
  )
}

export function PageTabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "flex-none rounded-none px-5 pt-1 pb-3 text-sm font-medium text-muted-foreground",
        "after:bottom-[-1px]! after:bg-brand data-active:text-brand",
        className
      )}
      {...props}
    />
  )
}
