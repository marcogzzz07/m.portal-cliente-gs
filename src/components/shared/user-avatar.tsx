import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/format"
import { cn } from "@/lib/utils"

const sizes = {
  sm: "size-7",
  md: "size-9",
  lg: "size-12",
  xl: "size-16",
}

// El tamaño de letra va en el fallback: el de shadcn fija text-sm y no hereda del contenedor.
const textSizes = {
  sm: "text-[0.65rem]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-lg",
}

interface UserAvatarProps {
  firstName: string
  lastName?: string
  size?: keyof typeof sizes
  /** Resalta a la persona (usuario actual o seleccionado) en el rojo de la marca. */
  highlight?: boolean
  className?: string
}

/** Avatar con iniciales (sin fotos), estilo Portal GS. */
export function UserAvatar({ firstName, lastName = "", size = "md", highlight = false, className }: UserAvatarProps) {
  return (
    <Avatar className={cn(sizes[size], className)}>
      <AvatarFallback className={cn("font-semibold text-white", textSizes[size], highlight ? "bg-brand" : "bg-[oklch(0.4_0.006_264)]")}>
        {getInitials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  )
}
