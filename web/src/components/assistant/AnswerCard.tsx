// Respuesta del asistente: estructura Hallazgo · Riesgo · Acción recomendada (PR A4 · PLAN_UX §5.5).
import { Lightbulb, ShieldAlert, Target } from "lucide-react";
import { AiBadge, Eyebrow } from "../ui";
import type { AskResponse } from "../../types/contracts";

const SECTIONS = [
  { key: "hallazgo", label: "Hallazgo", icon: Lightbulb, cls: "text-ai" },
  { key: "riesgo", label: "Riesgo", icon: ShieldAlert, cls: "text-high" },
  { key: "accion", label: "Acción recomendada", icon: Target, cls: "text-brand" },
] as const;
type Key = (typeof SECTIONS)[number]["key"];

/** Separa la respuesta en sus 3 partes si viene con ese formato; si no, devuelve null. */
export function parseAnswer(text: string): Record<Key, string> | null {
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const out: Partial<Record<Key, string>> = {};
  for (const line of text.split(/\n+/)) {
    const m = line.match(/^\s*\**\s*([^:*]+?)\s*\**\s*:\s*(.+)$/);
    if (!m || !m[1] || !m[2]) continue;
    const label = norm(m[1]);
    if (label.startsWith("hallazgo")) out.hallazgo = m[2].trim();
    else if (label.startsWith("riesgo")) out.riesgo = m[2].trim();
    else if (label.startsWith("accion")) out.accion = m[2].trim();
  }
  return out.hallazgo || out.riesgo || out.accion ? { hallazgo: out.hallazgo ?? "—", riesgo: out.riesgo ?? "—", accion: out.accion ?? "—" } : null;
}

export function AnswerCard({ result }: { result: AskResponse }) {
  const parts = parseAnswer(result.answer);
  return (
    <div className="lift rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>Respuesta de C&amp;I</Eyebrow>
        <AiBadge aiUsed={result.ai_used} model={result.ai_model} />
      </div>
      {parts ? (
        <dl className="space-y-3">
          {SECTIONS.map(({ key, label, icon: Icon, cls }) => (
            <div key={key} className="flex gap-3">
              <Icon size={18} className={`mt-0.5 shrink-0 ${cls}`} aria-hidden />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</dt>
                <dd className="text-[15px] leading-relaxed text-ink">{parts[key]}</dd>
              </div>
            </div>
          ))}
        </dl>
      ) : (
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{result.answer}</p>
      )}
    </div>
  );
}
