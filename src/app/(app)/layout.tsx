import { AppShell } from "@/components/layout/app-shell"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { ContextBar } from "@/components/layout/context-bar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Breadcrumb />
      <ContextBar />
      {children}
    </AppShell>
  )
}
