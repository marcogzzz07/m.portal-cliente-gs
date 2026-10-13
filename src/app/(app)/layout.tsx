import { AppShell } from "@/components/layout/app-shell"
import { Breadcrumb } from "@/components/layout/breadcrumb"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Breadcrumb />
      {children}
    </AppShell>
  )
}
