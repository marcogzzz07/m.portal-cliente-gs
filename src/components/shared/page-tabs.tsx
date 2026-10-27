"use client"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

/** Pestañas de página estilo Portal GS: subrayado rojo de 2px y texto activo en semibold. */
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
        "flex-none rounded-none px-4 pt-1 pb-2.5 text-[13px] font-medium text-muted-foreground",
        // Indicador rojo GS de 2px; el texto activo queda neutral, como las line-tabs del Portal GS.
        "after:bottom-[-1px]! after:h-0.5! after:bg-brand data-active:font-semibold data-active:text-foreground",
        className
      )}
      {...props}
    />
  )
}
