// Pestañas con contadores, simulador de llegada y buscador (PR G5).
import { Clock, Inbox, Layers, Lock, MailWarning, Send } from "lucide-react";
import { useState } from "react";
import type { DemoScenarioDto, MailboxResponse, MailboxView } from "../../types/contracts";
import { Button } from "../ui";

const TABS: { key: MailboxView; label: string; icon: typeof Inbox }[] = [
  { key: "ALL", label: "Todos", icon: Layers }, { key: "INBOX", label: "Bandeja", icon: Inbox },
  { key: "SPAM", label: "Spam", icon: MailWarning }, { key: "QUARANTINE", label: "Cuarentena", icon: Lock },
  { key: "PENDING", label: "Pendientes", icon: Clock },
];

export function MailboxToolbar({ view, onView, data, scenarios, busy, onSimulate }: {
  view: MailboxView; onView: (v: MailboxView) => void; data: MailboxResponse | null; scenarios: DemoScenarioDto[]; busy: boolean; onSimulate: (id: string) => void;
}) {
  const [caseId, setCaseId] = useState("");
  const count = (k: MailboxView) => !data ? 0 : k === "ALL" ? data.total : k === "PENDING" ? data.pending : data.counts[k];
  const chosen = caseId || scenarios[0]?.id || "";
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Carpetas">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} role="tab" aria-selected={view === key} type="button" onClick={() => onView(key)}
            className={`press inline-flex items-center gap-1.5 rounded-control border px-3 py-1.5 text-sm font-semibold ${view === key ? "border-sidebar bg-sidebar text-white" : "border-line bg-surface-2 text-ink-2 hover:text-ink"}`}>
            <Icon size={15} aria-hidden /> {label} <span className="font-mono text-xs opacity-80">({count(key)})</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-medium text-ink-muted">Escenario de demostración
          <select value={chosen} onChange={(e) => setCaseId(e.target.value)} className="mt-1 w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink">
            {scenarios.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <Button variant="navy" icon={<Send size={16} />} loading={busy} disabled={!chosen} onClick={() => onSimulate(chosen)}>Simular llegada de correo</Button>
      </div>
    </div>
  );
}
