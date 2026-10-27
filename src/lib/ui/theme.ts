// Tema del portal de clientes: "light" (Claro) y "dark" (Oscuro). Copiado del
// Portal GS interno (src/lib/ui/theme.ts) sin el tema Alternativo (navy).
// La preferencia vive en localStorage y se aplica como data-theme en <html>
// antes de la primera pintura (THEME_INIT_SCRIPT en el layout raíz), así no
// hay destello ni error de hidratación. Cualquier otro valor se migra a "light".

export type GsTheme = "light" | "dark"

export const THEME_STORAGE_KEY = "gs:theme"
const THEME_EVENT = "gs:theme-change"

export function normalizeTheme(value: string | null | undefined): GsTheme {
  return value === "dark" ? "dark" : "light"
}

/** Script en línea para <head>: lee, migra y aplica el tema guardado. */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY
)};var v=localStorage.getItem(k);var t=v==="dark"?"dark":"light";if(v!==t)localStorage.setItem(k,t);var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`

function applyTheme(theme: GsTheme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export function readTheme(): GsTheme {
  return normalizeTheme(document.documentElement.dataset.theme)
}

export function setTheme(theme: GsTheme) {
  applyTheme(theme)
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Sin almacenamiento (modo privado): el tema aplica solo a esta página.
  }
  window.dispatchEvent(new Event(THEME_EVENT))
}

export function subscribeTheme(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    applyTheme(normalizeTheme(event.newValue))
    onChange()
  }
  window.addEventListener(THEME_EVENT, onChange)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(THEME_EVENT, onChange)
    window.removeEventListener("storage", onStorage)
  }
}
