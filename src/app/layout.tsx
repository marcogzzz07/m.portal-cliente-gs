import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { site } from "@/config/site"
import { THEME_INIT_SCRIPT } from "@/lib/ui/theme"
import { AdminProvider } from "@/store/admin-store"
import { PortalProvider } from "@/store/portal-store"
import "./globals.css"

// Tipografía del Portal GS: Inter servida con next/font (sin pedirla a Google
// en cada visita y sin salto de texto). La expone como --font-inter.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eceef0" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2024" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme lo pone el script antes de pintar; el servidor no lo conoce.
    <html lang="es-MX" data-theme="light" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <PortalProvider>
          <AdminProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </AdminProvider>
        </PortalProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
