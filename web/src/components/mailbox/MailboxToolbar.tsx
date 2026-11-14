// Barra del buzón (dentro del panel): carpetas con contadores, simulador de llegada y buscador (PR G5).
import { Clock, Inbox, Layers, Lock, MailWarning, RefreshCw, Search, Send } from "lucide-react";
import { useState } from "react";
import type { DemoScenarioDto, MailboxResponse, MailboxView } from "../../types/contracts";
import { Button, Tooltip } from "../ui";

export const TABS: { key: MailboxView; label: string; icon: typeof Inbox }[] = [
  { key: "ALL", label: "Todos", icon: Layers }, { key: "INBOX", label: "Bandeja", icon: Inbox },
  { key: "SPAM", label: "Spam", icon: MailWarning }, { key: "QUARANTINE", label: "Cuarentena", icon: Lock },
  { key: "PENDING", label: "Pendientes", icon: Clock },
];

export function MailboxToolbar({ view, onView, data, scenarios, busy, onSimulate, q, onQ, shown, onRefresh }: {
  view: MailboxView; onView: (v: MailboxView) => void; data: MailboxResponse | null; scenarios: DemoScenarioDto[]; busy: boolean; onSimulate: (id: string) => void;
  q: string; onQ: (q: string) => void; shown: number; onRefresh: () => void;
}) {
  const [caseId, setCaseId] = useState("");
  const count = (k: MailboxView) => !data ? 0 : k === "ALL" ? data.total : k === "PENDING" ? data.pending : data.counts[k];
  const chosen = caseId || scenarios[0]?.id || "";
  return (
    <div className="border-b border-line">
      <div className="flex flex-wrap items-center gap-3 px-4 pt-4 sm:px-5">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-control bg-surface-2 p-1" role="tablist" aria-label="Carpetas">
          {TABS.map(({ key, label, icon: Icon }) => {
            const on = view === key;
            return (
              <button key={key} role="tab" aria-selected={on} type="button" onClick={() => onView(key)}
                className={`press inline-flex shrink-0 items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${on ? "bg-surface text-ink shadow-[0_1px_3px_rgba(2,6,23,0.15)]" : "text-ink-muted hover:text-ink"}`}>
                <Icon size={15} aria-hidden className={on ? "text-brand" : ""} /> {label}
                <span className={`rounded-full px-1.5 font-mono text-[11px] ${on ? "bg-brand-soft text-brand" : "bg-surface/70 text-ink-muted"}`}>{count(key)}</span>
              </button>
            );
          })}
        </div>
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <select value={chosen} onChange={(e) => setCaseId(e.target.value)} aria-label="Escenario de demostración"
            className="min-w-0 flex-1 rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink sm:w-56 sm:flex-none">
            {scenarios.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <Button variant="navy" icon={<Send size={16} />} loading={busy} disabled={!chosen} onClick={() => onSimulate(chosen)}>Simular llegada</Button>
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <label className="relative block flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden />
          <span className="sr-only">Buscar en el buzón</span>
          <input value={q} onChange={(e) => onQ(e.target.value)} placeholder="Buscar por asunto, remitente o dominio…"
            className="w-full rounded-full border border-line bg-surface-2 py-2 pl-9 pr-4 text-sm text-ink transition-colors focus:border-brand focus:bg-surface focus:outline-none" />
        </label>
        <span className="hidden shrink-0 font-mono text-xs text-ink-muted sm:inline">{shown} {shown === 1 ? "correo" : "correos"}</span>
        <Tooltip content="Actualizar" side="bottom">
          <button type="button" onClick={onRefresh} aria-label="Actualizar" className="press rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"><RefreshCw size={16} aria-hidden /></button>
        </Tooltip>
      </div>
    </div>
  );
}
