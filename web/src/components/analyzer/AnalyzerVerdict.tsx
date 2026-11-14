// Dictamen del Analizador (X3): Riesgo · Indicadores · Fundamento legal · Acción.
import { CheckCircle2, ListChecks, Scale, ShieldAlert } from "lucide-react";
import type { AnalyzeResponse } from "../../types/contracts";
import { AlertBadge, AiBadge, Card, CardHeader, Eyebrow, FolderBadge, ReviewBadge, RiskMeter } from "../ui";
import { CATEGORY } from "../mailbox/categories";

export function AnalyzerVerdict({ result }: { result: AnalyzeResponse }) {
  const findings = result.indicators;
  const review = result.human_review_required ? "PENDING" : "N/A";

  return (
    <div className="min-w-0 space-y-4">
      <Card accent="var(--ai)">
        <CardHeader
          title="Dictamen del correo"
          subtitle="Hallazgo técnico · Fundamento legal · Acción correctiva"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <AlertBadge level={result.risk_level} score={result.risk_score} />
              <FolderBadge folder={result.action_taken} />
              <ReviewBadge status={review} />
            </div>
          }
        />
        <RiskMeter score={result.risk_score} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <AiBadge aiUsed={result.ai_used} model={result.ai_model} />
          {result.pii_masked.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-badge border border-line-strong bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink-2">
              PII protegida: {result.pii_masked.join(", ")}
            </span>
          )}
          <span className="ml-auto font-mono text-[11px] text-ink-muted">event {result.event_id.slice(0, 8)}…</span>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={<span className="inline-flex items-center gap-2"><ListChecks size={19} aria-hidden /> Indicadores</span>}
          subtitle={`${findings.length} señal(es) detectada(s) por el motor de reglas`}
        />
        {findings.length === 0 ? (
          <div className="flex items-center gap-3 rounded-control border border-line bg-surface-2 p-4 text-sm text-ink-2">
            <CheckCircle2 size={18} className="text-safe" aria-hidden />
            No se detectaron señales de phishing. El correo queda en la bandeja.
          </div>
        ) : (
          <ul className="space-y-2">
            {findings.map((finding, index) => {
              const category = CATEGORY[finding.category] ?? CATEGORY.OTROS;
              const Icon = category.icon;
              return (
                <li key={`${finding.category}-${index}`} className="flex gap-3 rounded-control border border-line bg-surface-2 p-3">
                  <Icon size={18} className="mt-0.5 shrink-0 text-ink-2" aria-hidden />
                  <div>
                    <Eyebrow>{category.label}</Eyebrow>
                    <p className="text-sm text-ink">{finding.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {result.detected_urls.length > 0 && (
          <div className="mt-4 rounded-control border border-line bg-surface-2 p-3">
            <Eyebrow>URLs detectadas · no clicables</Eyebrow>
            <ul className="mt-1 space-y-1">
              {result.detected_urls.map((url) => (
                <li key={url} className="break-all font-mono text-xs text-critical">{url}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title={<span className="inline-flex items-center gap-2"><Scale size={19} aria-hidden /> Fundamento legal</span>}
          subtitle="Catálogo curado; la IA no inventa artículos"
        />
        {result.legal_basis.length === 0 ? (
          <p className="text-sm text-ink-2">Sin fundamento legal aplicable: no se detectaron conductas tipificadas.</p>
        ) : (
          <ul className="grid gap-2">
            {result.legal_basis.map((item, index) => (
              <li key={`${item.norma}-${index}`} className="rounded-control border border-line bg-surface-2 p-3">
                <p className="text-sm font-semibold text-ink">{item.norma}</p>
                <p className="font-mono text-xs text-ai">{item.referencia}</p>
                <p className="mt-1 text-sm text-ink-2">{item.relacion}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card accent={result.risk_level === "CRITICAL" ? "var(--critical)" : result.risk_level === "HIGH" ? "var(--high)" : "var(--safe)"}>
        <CardHeader
          title={<span className="inline-flex items-center gap-2"><ShieldAlert size={19} aria-hidden /> Acción recomendada</span>}
          subtitle={`Carpeta asignada: ${result.action_taken}`}
        />
        <p className="text-sm leading-relaxed text-ink">{result.recommendation}</p>
        <div className="mt-3 rounded-control border-l-4 border-ai bg-surface-2 p-3">
          <Eyebrow>Explicación del dictamen</Eyebrow>
          <p className="mt-1 text-sm leading-relaxed text-ink">{result.xai_explanation}</p>
        </div>
      </Card>
    </div>
  );
}
