"use client"

import { useSyncExternalStore } from "react"

import { readTheme, subscribeTheme, type GsTheme } from "@/lib/ui/theme"

/** Tema activo. En el servidor no hay tema guardado: se hidrata con "light". */
export function useGsTheme(): GsTheme {
  return useSyncExternalStore(subscribeTheme, readTheme, () => "light" as GsTheme)
}
