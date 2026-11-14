// Detalle del correo: encabezados, medidor, contenido neutralizado, hallazgos, fundamento legal y decisión (PR G5).
import { Eye, ScanSearch, ShieldCheck, Undo2 } from "lucide-react";
import { useState } from "react";
import { navigate } from "../../app/router";
import type { EmailDto, Role } from "../../types/contracts";
import { AiBadge, Button, Card, Eyebrow, FolderBadge, ReviewBadge, RiskMeter, RISK } from "../ui";
import { CATEGORY } from "./categories";

const ACTION = {
  CRITICAL: "No abrir enlaces ni adjuntos. Mantener en cuarentena y reportar al área de seguridad.",
  HIGH: "No abrir enlaces ni adjuntos. Verificar con el remitente por un canal oficial.",
  LOW: "Revisar con atención antes de responder o descargar adjuntos.",
  SAFE: "Sin acciones requeridas.",
} as const;
const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/g;

export function MailDetail({ email, role, onReview }: { email: EmailDto; role: Role; onReview: (d: "CONFIRM" | "RESTORE") => void }) {
  const [reveal, setReveal] = useState(false);
  const isQuarantine = email.folder === "QUARANTINE";
  const blurred = isQuarantine && !reveal;
  const canDecide = role !== "ANALYST" && (email.review_status === "PENDING" || isQuarantine);
  const findings = email.indicators.filter((i) => (i.weight ?? 1) > 0);
  const trust = email.indicators.filter((i) => (i.weight ?? 1) < 0);

  return (
    <Card className="animate-enter min-w-0 space-y-5" key={email.id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2"><FolderBadge folder={email.folder} /><ReviewBadge status={email.review_status} /></div>
        <span className="font-mono text-xs text-ink-muted">{new Date(email.received_at).toLocaleString("es-VE")}</span>
      </div>
      <h2 className="text-xl font-bold text-ink">{email.subject}</h2>
      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 rounded-control border border-line bg-surface-2 p-4 font-mono text-xs">
        <dt className="text-ink-muted">DE</dt><dd className="break-all text-ink">{email.from_name ? `${email.from_name} <${email.from_address}>` : email.from_address}</dd>
        {email.reply_to && <><dt className="text-ink-muted">REPLY-TO</dt><dd className="break-all text-ink">{email.reply_to}</dd></>}
        <dt className="text-ink-muted">PARA</dt><dd className="break-all text-ink">{email.recipient}</dd>
      </dl>
      {email.risk_score !== null && <RiskMeter score={email.risk_score} />}

      <div className="rounded-control border border-line bg-surface-2 p-4">
        <Eyebrow>Contenido del mensaje (enlaces neutralizados)</Eyebrow>
        <p className={`mt-2 whitespace-pre-line text-sm leading-relaxed text-ink transition-[filter] duration-300 ${blurred ? "select-none blur-[4px]" : ""}`}>
          {email.body_sanitized.split(URL_RE).map((part, i) => (i % 2 === 1 ? <span key={i} className="rounded-badge border border-critical/40 bg-critical-soft px-1 font-mono text-xs text-critical">URL desactivada: {part}</span> : <span key={i}>{part}</span>))}
        </p>
        {isQuarantine && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-ink-muted">
            <span>{blurred ? "Contenido difuminado por estar en cuarentena." : "Vista segura: los enlaces no son clicables."}</span>
            <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => setReveal((r) => !r)}>{blurred ? "Ver contenido (seguro)" : "Ocultar"}</Button>
          </div>
        )}
      </div>

      {findings.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold text-ink">Hallazgos técnicos</h3>
          <ul className="space-y-2">
            {[...findings, ...trust].map((f, i) => {
              const cat = (f.weight ?? 1) < 0 ? CATEGORY.CONFIANZA : CATEGORY[f.category] ?? CATEGORY.OTROS;
              const Icon = cat.icon;
              return (
                <li key={i} className="flex gap-3 rounded-control border border-line bg-surface-2 p-3">
                  <Icon size={18} className="mt-0.5 shrink-0 text-ink-2" aria-hidden />
                  <div><Eyebrow>{cat.label}</Eyebrow><p className="text-sm text-ink">{f.text}</p></div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {email.legal_basis.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold text-ink">Fundamento legal</h3>
          <ul className="grid gap-2 md:grid-cols-2">
            {email.legal_basis.map((l, i) => (
              <li key={i} className="rounded-control border border-line bg-surface-2 p-3">
                <p className="text-sm font-semibold text-ink">{l.norma}</p>
                <p className="font-mono text-xs text-ai">{l.referencia}</p>
                <p className="mt-1 text-sm text-ink-2">{l.relacion}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {email.xai_explanation && (
        <section className="rounded-control border-l-4 border-ai bg-surface-2 p-4">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-ink">Explicación del dictamen</h3><AiBadge aiUsed={false} /></div>
          <p className="text-sm leading-relaxed text-ink">{email.xai_explanation}</p>
        </section>
      )}
      {email.risk_level && (
        <section className="rounded-control border-l-4 border-sidebar bg-surface-2 p-4" style={{ borderLeftColor: RISK[email.risk_level].color }}>
          <h3 className="mb-1 font-semibold text-ink">Acción recomendada</h3>
          <p className="text-sm text-ink">{ACTION[email.risk_level]}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button variant="navy" icon={<ScanSearch size={16} />} onClick={() => navigate("analizar")}>Abrir en Analizador</Button>
        {canDecide && <Button variant="danger" icon={<ShieldCheck size={16} />} onClick={() => onReview("CONFIRM")}>Confirmar amenaza</Button>}
        {canDecide && <Button variant="success" icon={<Undo2 size={16} />} onClick={() => onReview("RESTORE")}>Restaurar a bandeja</Button>}
      </div>
    </Card>
  );
}
