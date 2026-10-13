"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { findActiveNavItem } from "@/config/navigation"
import { site } from "@/config/site"

/** Ruta de navegación: Portal de Clientes › Sección › Detalle. */
export function Breadcrumb({ current }: { current?: string }) {
  const pathname = usePathname()
  const item = findActiveNavItem(pathname)
  const isRoot = pathname === site.home
  const isDetail = item && pathname !== item.href

  return (
    <nav aria-label="Ruta" className="mb-4 hidden items-center gap-1.5 text-[13px] text-muted-foreground sm:flex">
      <Link href={site.home} className="hover:text-foreground hover:underline">
        {site.name}
      </Link>
      {!isRoot && item && (
        <>
          <ChevronRight className="size-3" />
          {isDetail ? (
            <Link href={item.href} className="hover:text-foreground hover:underline">
              {item.title}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.title}</span>
          )}
        </>
      )}
      {isDetail && current && (
        <>
          <ChevronRight className="size-3" />
          <span className="max-w-[40ch] truncate font-medium text-foreground">{current}</span>
        </>
      )}
    </nav>
  )
}
