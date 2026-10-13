import Link from "next/link"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { site } from "@/config/site"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        icon={Compass}
        title="No encontramos esta página"
        description="Es posible que la dirección esté mal escrita o que la sección todavía no exista."
        action={
          <Button asChild>
            <Link href={site.home}>Ir al inicio</Link>
          </Button>
        }
        className="w-full max-w-lg"
      />
    </div>
  )
}
