import { Building2 } from "lucide-react"

import { companiesLabel } from "@/lib/labels"
import type { CompanyId } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Razón social (o número de empresas) de un registro. */
export function CompanyTag({ companies, className }: { companies: CompanyId[]; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground", className)}>
      <Building2 className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{companiesLabel(companies)}</span>
    </span>
  )
}
