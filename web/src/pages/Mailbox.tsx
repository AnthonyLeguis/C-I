// Pantalla del Buzón de Alertas (PR G5 · PLAN_UX §5.3), con distribución tipo Gmail: un solo panel que
// muestra el listado de correos y, al abrir uno, el lector en su lugar (volver, anterior y siguiente).
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MailDetail } from "../components/mailbox/MailDetail";
import { MailboxToolbar, TABS } from "../components/mailbox/MailboxToolbar";
import { MailList } from "../components/mailbox/MailList";
import { ErrorState, Skeleton, Tooltip, useToast } from "../components/ui";
import { useMailbox } from "../hooks/useMailbox";
import { useSession } from "../hooks/useSession";

export function MailboxPage() {
  const m = useMailbox();
  const { user } = useSession();
  const toast = useToast();
  const [q, setQ] = useState("");
  const top = useRef<HTMLDivElement>(null);

  const term = q.trim().toLowerCase();
  const shown = useMemo(() => {
    const all = m.data?.emails ?? [];
    return term ? all.filter((e) => `${e.subject} ${e.from_address} ${e.from_name ?? ""}`.toLowerCase().includes(term)) : all;
  }, [m.data, term]);
  const reading = m.selected !== null && user !== null;
  const idx = m.selected ? shown.findIndex((e) => e.id === m.selected?.id) : -1;

  const open = (id: string) => { m.setSelectedId(id); top.current?.scrollIntoView({ block: "start", behavior: "smooth" }); };
  const back = () => m.setSelectedId(null);
  const step = (d: -1 | 1) => { const next = shown[idx + d]; if (next) open(next.id); };

  // Esc vuelve al listado (si no hay un modal abierto encima).
  useEffect(() => {
    if (!reading) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector('[role="dialog"]')) m.setSelectedId(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [reading, m.setSelectedId]);

  const simulate = async (id: string) => {
    try {
      const r = await m.simulate(id);
      setQ("");
      toast.notify("info", "Correo analizado y clasificado", `hash ${r.audit_hash.slice(0, 12)}…`);
    } catch { toast.notify("error", "No se pudo simular la llegada"); }
  };
  const review = async (d: "CONFIRM" | "RESTORE") => {
    if (!m.selected) return;
    try {
      const r = await m.review(m.selected.id, d);
      toast.notify("success", d === "CONFIRM" ? "Amenaza confirmada · registrada en bitácora" : "Correo restaurado a bandeja · registrado en bitácora", `hash ${r.audit_hash.slice(0, 12)}…`);
    } catch { toast.notify("error", "Tu rol no permite esta acción o hubo un error"); }
  };
  const action = async (k: "approve" | "escalate" | "block") => {
    if (!m.selected) return;
    try {
      const r = await m.act(k, m.selected.id);
      toast.notify(k === "block" ? "error" : "success", `${r.label} · registrado en bitácora`, `hash ${r.hash.slice(0, 12)}…`);
    } catch (e: unknown) { toast.notify("error", e instanceof Error ? e.message : "No se pudo completar la acción"); }
  };

  const folderLabel = TABS.find((t) => t.key === m.view)?.label ?? "Buzón";
  const navBtn = "press rounded-full p-2 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-35";

  return (
    <div ref={top} className="mx-auto max-w-7xl scroll-mt-24">
      {m.error && <ErrorState text={m.error} onRetry={() => void m.reload()} />}
      <div className="overflow-clip rounded-card border border-line bg-surface/90 shadow-card">
        {reading && m.selected && user ? (
          <>
            {/* Barra del lector */}
            <div className="sticky top-[72px] z-20 flex items-center gap-1 border-b border-line bg-surface/95 px-2 py-1.5 backdrop-blur sm:px-3">
              <Tooltip content="Volver al buzón (Esc)" side="bottom">
                <button type="button" onClick={back} aria-label="Volver al buzón" className={navBtn}><ArrowLeft size={18} aria-hidden /></button>
              </Tooltip>
              <span className="ml-1 text-sm font-semibold text-ink-2">{folderLabel}</span>
              <div className="ml-auto flex items-center gap-1">
                {idx >= 0 && <span className="mr-1 font-mono text-xs text-ink-muted">{idx + 1} de {shown.length}</span>}
                <Tooltip content="Más reciente" side="bottom">
                  <button type="button" onClick={() => step(-1)} disabled={idx <= 0} aria-label="Correo anterior" className={navBtn}><ChevronLeft size={18} aria-hidden /></button>
                </Tooltip>
                <Tooltip content="Más antiguo" side="bottom">
                  <button type="button" onClick={() => step(1)} disabled={idx < 0 || idx >= shown.length - 1} aria-label="Correo siguiente" className={navBtn}><ChevronRight size={18} aria-hidden /></button>
                </Tooltip>
              </div>
            </div>
            <MailDetail key={m.selected.id} email={m.selected} role={user.role} onReview={(d) => void review(d)} onAction={(k) => void action(k)} />
          </>
        ) : (
          <div className="animate-enter">
            <MailboxToolbar view={m.view} onView={m.setView} data={m.data} scenarios={m.scenarios} busy={m.busy} onSimulate={(id) => void simulate(id)}
              q={q} onQ={setQ} shown={shown.length} onRefresh={() => void m.reload()} />
            {!m.data && !m.error
              ? <div className="space-y-3 p-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              : <MailList emails={shown} freshId={m.freshId} onOpen={open} />}
          </div>
        )}
      </div>
    </div>
  );
}
