import { BrandMark } from "@/components/layout/brand-logo"
import { documentContent, textColumns } from "@/lib/doc-content"
import type { DocumentItem } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Vista previa "impresa" del entregable: misma información que el PDF descargable. */
export function DocumentPaper({ doc, className }: { doc: DocumentItem; className?: string }) {
  const c = documentContent(doc)
  return (
    <article className={cn("relative mx-auto w-full max-w-[720px] overflow-hidden gs-keep-light rounded-lg bg-white px-6 py-7 text-[13px] text-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/5 sm:px-10 sm:py-9", className)}>
      <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] text-[64px] font-black tracking-widest whitespace-nowrap text-neutral-900/[0.035] select-none" aria-hidden>
        FICTICIO
      </span>

      <header className="flex items-start gap-3 border-b border-neutral-200 pb-5">
        <BrandMark className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] tracking-wide text-neutral-500 uppercase">{c.issuer}</p>
          <h2 className="mt-1 text-lg leading-snug font-semibold text-neutral-900">{c.title}</h2>
          <p className="text-neutral-500">{c.subtitle}</p>
        </div>
      </header>

      {c.meta.length > 0 && (
        <dl className="grid gap-x-6 gap-y-2 border-b border-neutral-200 py-5 sm:grid-cols-[180px_minmax(0,1fr)]">
          {c.meta.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-neutral-500">{k}</dt>
              <dd className="font-medium break-words text-neutral-900">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {c.tables.map((t) => {
        const isText = textColumns(t)
        return (
        <section key={t.heading} className="pt-5">
          <h3 className="mb-2 text-sm font-semibold text-neutral-900">{t.heading}</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-[12.5px]">
              <thead>
                <tr className="border-b border-neutral-300 text-neutral-500">
                  {t.columns.map((col, i) => (
                    <th key={col} className={cn("py-2 pr-2 font-medium last:pr-0", isText[i] ? "text-left" : "text-right")}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((r, ri) => (
                  <tr key={ri} className="border-b border-neutral-100">
                    {r.map((cell, i) => (
                      <td key={i} className={cn("py-1.5 pr-2 tabular-nums last:pr-0", isText[i] ? "text-left" : "text-right")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
                {t.total && (
                  <tr className="border-t-2 border-neutral-800 font-semibold text-neutral-900">
                    <td className="py-2">{t.total[0]}</td>
                    {Array.from({ length: t.columns.length - t.total.length }).map((_, i) => (
                      <td key={`gap-${i}`} />
                    ))}
                    {t.total.slice(1).map((cell, i) => (
                      <td key={i} className="py-2 text-right tabular-nums">
                        {cell}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        )
      })}

      <footer className="mt-6 space-y-1 border-t border-neutral-200 pt-4 text-[11px] leading-relaxed text-neutral-500">
        {c.notes.map((n) => (
          <p key={n}>{n}</p>
        ))}
        <p className="pt-1 font-medium">Documento ficticio · Prototipo del Portal de Clientes GS</p>
      </footer>
    </article>
  )
}
