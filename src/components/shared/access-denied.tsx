import Link from "next/link"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "./empty-state"

/** Estado de acceso restringido: el usuario no tiene permiso sobre el módulo o el registro. */
export function AccessDenied({ title = "No tienes acceso a esta información", description }: { title?: string; description?: string }) {
  return (
    <EmptyState
      icon={Lock}
      title={title}
      description={description ?? "Tu rol o las empresas que tienes asignadas no incluyen esta sección. Si la necesitas, pide acceso al administrador de tu empresa."}
      action={
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      }
    />
  )
}
