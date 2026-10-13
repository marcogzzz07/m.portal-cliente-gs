"use client"

import { CircleHelp } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { site } from "@/config/site"

export function HelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="hidden rounded-full sm:inline-flex" aria-label="Ayuda">
          <CircleHelp className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">¿Necesitas ayuda?</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {site.help.map(({ label, icon: Icon }) => (
          <DropdownMenuItem key={label} onSelect={() => toast.info(`${label}: simulado en el prototipo.`)}>
            <Icon />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
