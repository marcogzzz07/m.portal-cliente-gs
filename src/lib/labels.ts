import { companies, group } from "@/data/organization"
import type { CompanyId } from "./types"

/** "EcoPack Comercial", "3 empresas" o "Grupo completo (5 empresas)". */
export function companiesLabel(ids: CompanyId[]) {
  if (ids.length === 1) return companies.find((c) => c.id === ids[0])!.name
  if (ids.length === companies.length) return `${group.shortName} · 5 empresas`
  return `${ids.length} empresas`
}

/** Nombre corto sin "EcoPack": "Comercial". */
export function companyShort(id: CompanyId) {
  return companies.find((c) => c.id === id)!.name.replace("EcoPack ", "")
}
