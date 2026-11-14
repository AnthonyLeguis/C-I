// Pantalla del Asistente IA con guardián ético (PR A4 · Anthony · PLAN_UX §5.5).
import { Lock, MessageSquareText, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { AnswerCard } from "../components/assistant/AnswerCard";
import { BlockedCard } from "../components/assistant/BlockedCard";
import { Composer, SUGGESTIONS } from "../components/assistant/Composer";
import { OutOfScopeCard } from "../components/assistant/OutOfScopeCard";
import { MaskedText } from "../components/assistant/MaskedText";
import { Button, EmptyState, ErrorState, Eyebrow, Skeleton, Stagger } from "../components/ui";
import { useAssistant } from "../hooks/useAssistant";

export function AssistantPage() {
  const { turns, loading, ask, clear } = useAssistant();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, loading]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface px-4 py-3 text-sm text-ink-2 shadow-card">
        <ShieldCheck size={18} className="text-brand" aria-hidden />
        <span className="min-w-[220px] flex-1">Asistente de contexto cerrado: responde solo sobre el sistema C&amp;I y la seguridad del correo del banco. Tus datos personales se tapan antes de llegar a la IA y se rechaza cualquier petición para atacar.</span>
        {turns.length > 0 && <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={clear}>Nueva conversación</Button>}
      </div>

      {turns.length === 0 && !loading ? (
        <EmptyState
          icon={MessageSquareText}
          title="¿En qué te ayudo con el sistema C&I?"
          text="Pregunta cómo usar el sistema, cómo se calcula el riesgo o qué hacer con un correo sospechoso. Las preguntas ajenas al sistema no se responden."
          action={
            <Stagger className="mt-2 flex flex-wrap justify-center gap-2" step={60}>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => void ask(s)} className="press lift rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm text-ink-2 hover:text-ink">
                  {s}
                </button>
              ))}
            </Stagger>
          }
        />
      ) : (
        <ol className="flex flex-col gap-4" aria-live="polite">
          {turns.map((t) => (
            <li key={t.id} className="animate-enter">
              {t.kind === "question" && <Question original={t.original} sanitized={nextSanitized(turns, t.id)} />}
              {t.kind === "answer" && (t.result.blocked ? <BlockedCard result={t.result} /> : t.result.out_of_scope ? <OutOfScopeCard result={t.result} onAsk={(q) => void ask(q)} /> : <AnswerCard result={t.result} />)}
              {t.kind === "error" && <ErrorState text={t.message} onRetry={() => void ask(t.retry)} />}
            </li>
          ))}
          {loading && (
            <li className="rounded-card border border-line bg-surface p-5 shadow-card" role="status" aria-label="El asistente está respondiendo">
              <Eyebrow>Revisando la pregunta con el guardián ético…</Eyebrow>
              <Skeleton className="mt-3 h-3 w-5/6" />
              <Skeleton className="mt-2 h-3 w-4/6" />
              <Skeleton className="mt-2 h-3 w-3/6" />
            </li>
          )}
        </ol>
      )}

      <div ref={endRef} />
      <div className="sticky bottom-3">
        <Composer onSend={(q) => void ask(q)} loading={loading} />
      </div>
    </div>
  );
}

/** La versión anonimizada viene en la respuesta siguiente a la pregunta. */
function nextSanitized(turns: ReturnType<typeof useAssistant>["turns"], questionId: number): string | null {
  const i = turns.findIndex((t) => t.id === questionId);
  const next = turns[i + 1];
  return next && next.kind === "answer" ? next.result.sanitized_question : null;
}

function Question({ original, sanitized }: { original: string; sanitized: string | null }) {
  const masked = sanitized !== null && sanitized !== original;
  return (
    <div className="ml-auto max-w-[85%] rounded-card rounded-br-[2px] bg-sidebar px-4 py-3 text-white shadow-card">
      <p className="text-[15px] leading-relaxed">{original}</p>
      {masked && (
        <div className="mt-2 rounded-control bg-white/95 px-3 py-2 text-sm text-ink">
          <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            <Lock size={11} aria-hidden /> Lo que recibió la IA
          </p>
          <p><MaskedText text={sanitized} /></p>
        </div>
      )}
    </div>
  );
}
