import Image from "next/image"

import { site } from "@/config/site"
import { cn } from "@/lib/utils"

/** Logo oficial de GS (espiral roja, fondo transparente). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image src="/brand/gs-logo.png" alt={site.company} width={32} height={32} priority unoptimized className={cn("size-8 shrink-0", className)} />
  )
}

export function BrandLogo({ className, subtitle = site.module }: { className?: string; subtitle?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight text-white">{site.name}</span>
        <span className="text-xs text-sidebar-foreground/70">{subtitle}</span>
      </span>
    </div>
  )
}
