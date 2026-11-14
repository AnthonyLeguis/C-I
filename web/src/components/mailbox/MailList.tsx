// Listado de correos estilo Gmail: una fila por correo (avatar, remitente, asunto — extracto, nivel y hora).
// Al abrir uno, la página muestra el lector en lugar del listado. El correo recién llegado entra con destello.
import { ChevronRight, Lock } from "lucide-react";
import type { CSSProperties } from "react";
import type { EmailDto } from "../../types/contracts";
import { AlertBadge, EmptyState, RISK } from "../ui";
import { SenderAvatar } from "./SenderAvatar";

/** Hoy → «03:56»; otro día → «13/11». */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" });
}
const snippet = (e: EmailDto) => e.body_sanitized.replace(/https?:\/\/\S+/g, "[enlace]").replace(/\s+/g, " ").trim().slice(0, 140);

function PendingChip({ status }: { status: EmailDto["review_status"] }) {
  if (status !== "PENDING" && status !== "ESCALATED") return null;
  const escalated = status === "ESCALATED";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${escalated ? "bg-escalated-soft text-escalated" : "bg-high-soft text-high"}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${escalated ? "" : "animate-ci-pulse"}`} aria-hidden />{escalated ? "Escalado" : "Pendiente"}
    </span>
  );
}

export function MailList({ emails, freshId, onOpen }: { emails: EmailDto[]; freshId: string | null; onOpen: (id: string) => void }) {
  if (emails.length === 0) {
    return <div className="p-6"><EmptyState title="No hay correos aquí" text="Usa «Simular llegada de correo» para ver cómo actúa C&I." /></div>;
  }
  return (
    <ul className="divide-y divide-line" aria-label="Correos">
      {emails.map((e, i) => {
        const fresh = e.id === freshId;
        const color = e.risk_level ? RISK[e.risk_level].color : "transparent";
        const style = { "--flash-color": color, animationDelay: fresh ? undefined : `${Math.min(i, 12) * 25}ms` } as CSSProperties;
        const unread = e.review_status === "PENDING" || e.review_status === "ESCALATED";
        const quarantined = e.folder === "QUARANTINE";
        return (
          <li key={e.id} className={fresh ? "animate-arrive" : "animate-enter"} style={style}>
            <button type="button" onClick={() => onOpen(e.id)}
              className="group relative flex w-full items-center gap-3 px-4 py-3 text-left transition-[background-color,box-shadow] duration-150 hover:z-10 hover:bg-surface hover:shadow-[0_6px_18px_-8px_rgba(2,6,23,0.35)] focus-visible:z-10 sm:gap-4 sm:px-5">
              <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} aria-hidden />
              <SenderAvatar name={e.from_name} address={e.from_address} level={e.risk_level} />

              <div className="min-w-0 flex-1 md:grid md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:items-center md:gap-5">
                <p className={`truncate text-sm ${unread ? "font-bold text-ink" : "font-semibold text-ink-2"}`}>{e.from_name ?? e.from_address}</p>
                <p className="truncate text-sm">
                  <span className={unread ? "font-semibold text-ink" : "font-medium text-ink"}>{e.subject}</span>
                  <span className="text-ink-muted"> — {quarantined ? <span className="inline-flex items-center gap-1"><Lock size={12} className="inline" aria-hidden />contenido aislado en cuarentena</span> : snippet(e)}</span>
                </p>
                {/* móvil: nivel y estado bajo el asunto */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
                  {e.risk_level && <AlertBadge level={e.risk_level} score={e.risk_score ?? undefined} />}
                  <PendingChip status={e.review_status} />
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-2 md:flex">
                <PendingChip status={e.review_status} />
                {e.risk_level && <AlertBadge level={e.risk_level} score={e.risk_score ?? undefined} />}
              </div>
              <span className={`shrink-0 whitespace-nowrap text-right font-mono text-xs sm:w-[5.5rem] ${unread ? "font-semibold text-ink" : "text-ink-muted"}`}>{shortDate(e.received_at)}</span>
              <ChevronRight size={16} aria-hidden className="hidden shrink-0 text-ink-muted opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0.5 group-hover:opacity-100 sm:block" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
