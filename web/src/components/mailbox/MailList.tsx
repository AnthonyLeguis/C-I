// Lista de correos con buscador (PR G5). El correo recién llegado entra deslizándose con destello.
import { Search } from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { EmailDto } from "../../types/contracts";
import { AlertBadge, EmptyState, ReviewBadge, RISK } from "../ui";

const fmt = (iso: string) => new Date(iso).toLocaleString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function MailList({ emails, selectedId, freshId, onSelect }: { emails: EmailDto[]; selectedId: string | null; freshId: string | null; onSelect: (id: string) => void }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const shown = term ? emails.filter((e) => `${e.subject} ${e.from_address} ${e.from_name ?? ""}`.toLowerCase().includes(term)) : emails;
  return (
    <div className="flex min-h-0 min-w-0 flex-col rounded-card border border-line bg-surface shadow-card">
      <label className="relative m-3 block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden />
        <span className="sr-only">Buscar en buzón</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por asunto, remitente o dominio…" className="w-full rounded-control border border-line bg-surface-2 py-2 pl-9 pr-3 text-sm text-ink focus:border-brand focus:outline-none" />
      </label>
      {shown.length === 0 ? (
        <div className="p-3"><EmptyState title="No hay correos aquí" text="Usa «Simular llegada de correo» para ver cómo actúa C&I." /></div>
      ) : (
        <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
          {shown.map((e) => {
            const fresh = e.id === freshId;
            const style = fresh && e.risk_level ? ({ "--flash-color": RISK[e.risk_level].color } as CSSProperties) : undefined;
            return (
              <li key={e.id}>
                <button type="button" onClick={() => onSelect(e.id)} style={style} aria-current={e.id === selectedId}
                  className={`w-full px-4 py-3 text-left transition-colors ${e.id === selectedId ? "border-l-4 border-sidebar bg-low-soft" : "border-l-4 border-transparent hover:bg-surface-2"} ${fresh ? "animate-arrive" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    {e.risk_level ? <AlertBadge level={e.risk_level} score={e.risk_score ?? undefined} /> : <span />}
                    <span className="font-mono text-[11px] text-ink-muted">{fmt(e.received_at)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-ink">{e.from_name ?? e.from_address}</p>
                  <p className="truncate text-sm text-ink-2">{e.subject}</p>
                  {e.review_status !== "N/A" && <div className="mt-1"><ReviewBadge status={e.review_status} /></div>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
