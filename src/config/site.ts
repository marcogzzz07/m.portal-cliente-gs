import { BookOpenText, LifeBuoy, MessageCircle } from "lucide-react"

/**
 * Datos del portal. El nombre definitivo y la identidad los define la agencia;
 * mientras tanto se usa la identidad visual de la plantilla Portal GS.
 */
export const site = {
  name: "Portal de Clientes",
  module: "González Solís",
  company: "González Solís",
  description: "Prototipo navegable del Portal de Clientes GS con datos ficticios.",
  home: "/",
  help: [
    { label: "Guía rápida del portal", icon: BookOpenText },
    { label: "Mesa de ayuda del portal", icon: LifeBuoy },
    { label: "Escribir a mi contacto GS", icon: MessageCircle },
  ],
}
