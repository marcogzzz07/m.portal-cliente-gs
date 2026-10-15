import type { NewsItem } from "@/lib/types"
import type { StatusMeta } from "@/lib/status"

export const impactMeta: Record<NewsItem["impact"], StatusMeta> = {
  alto: { label: "Impacto alto", tone: "danger" },
  medio: { label: "Impacto medio", tone: "warning" },
  informativo: { label: "Informativo", tone: "neutral" },
}
