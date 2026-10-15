import type { Metadata } from "next"

import { UsersView } from "@/components/features/usuarios/users-view"

export const metadata: Metadata = { title: "Usuarios y permisos" }

export default function UsuariosPage() {
  return <UsersView />
}
