// Pregunta fuera del contexto del sistema (contexto cerrado del asistente): respuesta fija y temas sugeridos.
import { CircleHelp } from "lucide-react";
import type { AskResponse } from "../../types/contracts";

export const SYSTEM_TOPICS = [
  "¿Cómo se calcula el puntaje de riesgo?",
  "¿Cómo escalo un caso al CISO?",
  "¿Qué puede hacer cada perfil?",
];

export function OutOfScopeCard({ result, onAsk }: { result: AskResponse; onAsk?: (q: string) => void }) {
  return (
    <div className="rounded-card border border-line-strong bg-surface p-4 shadow-card sm:p-5">
      <p className="inline-flex items-center gap-2 font-semibold text-ink-2">
        <CircleHelp size={18} aria-hidden className="text-ai" /> Fuera del contexto del sistema
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink">{result.answer}</p>
      {onAsk && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SYSTEM_TOPICS.map((q) => (
            <button key={q} type="button" onClick={() => onAsk(q)} className="press rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2 transition-colors hover:border-brand hover:text-brand">{q}</button>
          ))}
        </div>
      )}
    </div>
  );
}
