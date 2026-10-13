import type { Metadata, Viewport } from "next"
import { Figtree } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { site } from "@/config/site"
import { PortalProvider } from "@/store/portal-store"
import "./globals.css"

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: `${site.name} · ${site.module}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f1f2f4",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${figtree.variable} h-full antialiased`}>
      <body className="min-h-full">
        <PortalProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </PortalProvider>
        <Toaster theme="light" position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
