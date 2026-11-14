// Petición bloqueada por el guardián ético (PR A4 · PLAN_UX §5.5).
import { Ban } from "lucide-react";
import type { CSSProperties } from "react";
import type { AskResponse } from "../../types/contracts";

const REASON: Record<AskResponse["block_reasons"][number], string> = {
  PROMPT_INJECTION: "Intento de manipulación de instrucciones",
  OFFENSIVE_REQUEST: "Petición ofensiva (C&I solo defiende)",
};

export function BlockedCard({ result }: { result: AskResponse }) {
  return (
    <div className="animate-flash rounded-card border border-critical/50 bg-critical-soft p-4 shadow-card sm:p-5" style={{ "--flash-color": "var(--critical)" } as CSSProperties}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 font-semibold text-critical">
          <Ban size={18} aria-hidden /> Bloqueado por el guardián ético
        </p>
        <span className="font-mono text-[11px] uppercase tracking-wide text-critical/80">Registrado en bitácora</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {result.block_reasons.map((r) => (
          <li key={r} className="rounded-badge border border-critical/40 bg-surface px-2 py-0.5 text-xs font-semibold text-critical">{REASON[r]}</li>
        ))}
      </ul>
      <p className="mt-3 text-[15px] leading-relaxed text-ink">{result.answer}</p>
    </div>
  );
}
