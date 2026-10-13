"use client"

import { useState } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PersonChip } from "@/components/shared/person-chip"
import { companies, gsTeam, serviceNames } from "@/data/organization"
import { useScopedData } from "@/hooks/use-scoped-data"
import type { CompanyId, Conversation, ServiceKey } from "@/lib/types"
import { usePortal } from "@/store/portal-store"

type Kind = "general" | "documento" | "pendiente"

/** Toda conversación nace con contexto y responsable GS (Benchmark: evitar otro canal desordenado). */
export function NewConversationDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (id: string) => void }) {
  const { createConversation, allowed, state } = usePortal()
  const { documents, actions } = useScopedData()
  const [kind, setKind] = useState<Kind>("general")
  const [ref, setRef] = useState<string>("")
  const [company, setCompany] = useState<CompanyId>(state.scope === "grupo" ? allowed[0] : state.scope)
  const [service, setService] = useState<ServiceKey>("contabilidad")
  const [subject, setSubject] = useState("")
  const [text, setText] = useState("")

  const doc = kind === "documento" ? documents.find((d) => d.id === ref) : undefined
  const action = kind === "pendiente" ? actions.find((a) => a.id === ref) : undefined
  const effService: ServiceKey = doc?.service ?? action?.service ?? service
  const effCompanies: CompanyId[] = doc?.companies ?? action?.companies ?? [company]
  const owner =
    action?.gsOwnerId ??
    doc?.requestedBy ??
    gsTeam.find((g) => g.services.includes(effService) && !g.primary && (g.companies === "all" || g.companies.some((c) => effCompanies.includes(c))))?.personId ??
    "mariana"

  const ready = text.trim() && (kind === "general" ? subject.trim() : ref)

  function submit() {
    const context: Conversation["context"] =
      kind === "documento" && doc
        ? { type: "documento", refId: doc.id, label: `${doc.name} · ${doc.period}` }
        : kind === "pendiente" && action
          ? { type: "pendiente", refId: action.id, label: action.title }
          : { type: "general", label: serviceNames[effService] }
    const id = createConversation({ subject: subject.trim() || doc?.name || action?.title || "Consulta", context, companies: effCompanies, service: effService, gsOwnerId: owner }, text.trim())
    onOpenChange(false)
    setSubject("")
    setText("")
    setRef("")
    onCreated(id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva conversación</DialogTitle>
          <DialogDescription>Liga tu mensaje a un documento o pendiente para que llegue con contexto a la persona correcta.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>¿Sobre qué es?</Label>
            <Select
              value={kind}
              onValueChange={(v) => {
                setKind(v as Kind)
                setRef("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Consulta general sobre un servicio</SelectItem>
                <SelectItem value="documento">Un documento</SelectItem>
                <SelectItem value="pendiente">Un pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {kind === "general" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Empresa</Label>
                <Select value={company} onValueChange={(v) => setCompany(v as CompanyId)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companies
                      .filter((c) => allowed.includes(c.id))
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Servicio</Label>
                <Select value={service} onValueChange={(v) => setService(v as ServiceKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["contabilidad", "impuestos", "auditoria", "legal", "facturacion"] as ServiceKey[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {serviceNames[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej. Duda sobre la deducción de viáticos" />
              </div>
            </div>
          )}

          {kind === "documento" && (
            <div className="grid gap-1.5">
              <Label>Documento</Label>
              <Select value={ref} onValueChange={setRef}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige un documento" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} · {d.period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {kind === "pendiente" && (
            <div className="grid gap-1.5">
              <Label>Pendiente</Label>
              <Select value={ref} onValueChange={setRef}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige un pendiente" />
                </SelectTrigger>
                <SelectContent>
                  {actions
                    .filter((a) => a.status !== "completed")
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="msg">Mensaje</Label>
            <Textarea id="msg" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe tu mensaje…" />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
            <span className="text-xs text-muted-foreground">Responsable GS</span>
            <PersonChip id={owner} showTitle />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!ready}>
            <Send />
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
