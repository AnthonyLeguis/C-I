// Badges de nivel, carpeta, revisión, escalado e IA (PR X2 · PLAN_UX §3).
import { Ban, Cpu, Sparkles } from "lucide-react";
import type { Folder, ReviewStatus, RiskLevel } from "../../types/contracts";
import { ESCALATED, FOLDER, REVIEW, RISK, type VisualSpec } from "./levels";

function Badge({ spec, text, pulse = false }: { spec: VisualSpec; text?: string; pulse?: boolean }) {
  const Icon = spec.icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-badge border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${spec.tone}`}>
      {pulse ? <span className="h-1.5 w-1.5 rounded-full bg-current animate-ci-pulse" aria-hidden /> : <Icon size={13} aria-hidden />}
      {text ?? spec.label}
    </span>
  );
}

/** Nivel de riesgo, opcionalmente con el puntaje: [🛡 CRÍTICO 97] */
export function AlertBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const spec = RISK[level];
  return <Badge spec={spec} text={score === undefined ? spec.label : `${spec.label} ${score}`} />;
}

export function FolderBadge({ folder }: { folder: Folder }) {
  return <Badge spec={FOLDER[folder]} />;
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  if (status === "N/A") return null;
  return <Badge spec={REVIEW[status]} pulse={status === "PENDING"} />;
}

export function EscalatedBadge() {
  return <Badge spec={ESCALATED} />;
}

/** Transparencia IA (PLAN_UX §3.4). */
export function AiBadge({ aiUsed, model, blocked = false }: { aiUsed: boolean; model?: string | null; blocked?: boolean }) {
  if (blocked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-badge border border-critical/40 bg-critical-soft px-2 py-0.5 text-xs font-semibold text-critical">
        <Ban size={13} aria-hidden /> BLOQUEADO POR EL GUARDIÁN ÉTICO
      </span>
    );
  }
  if (!aiUsed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-badge border border-line-strong bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink-2">
        <Cpu size={13} aria-hidden /> ANÁLISIS DETERMINISTA (REGLAS)
      </span>
    );
  }
  const name = model ? prettyModel(model) : "IA";
  return (
    <span className="inline-flex items-center gap-1 rounded-badge border border-ai/40 bg-ai-soft px-2 py-0.5 text-xs font-semibold text-ai">
      <Sparkles size={13} aria-hidden /> EXPLICACIÓN GENERADA POR IA · {name}
    </span>
  );
}

export function prettyModel(id: string): string {
  if (id.includes("llama-3.3-70b")) return "LLAMA 3.3 70B";
  if (id.includes("llama-4-scout")) return "LLAMA 4 SCOUT";
  if (id.includes("llama-guard")) return "LLAMA GUARD 3";
  return id.split("/").pop()?.toUpperCase() ?? id;
}
