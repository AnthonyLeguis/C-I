// Panel Principal (PR G6 · PLAN_UX §4.1, prototipo de Alejandro).
import { Clock, Lock, MailCheck, MailWarning, ShieldCheck, ShieldX } from "lucide-react";
import { navigate } from "../app/router";
import { CATEGORY } from "../components/mailbox/categories";
import { HBars, RiskDonut, TimelineChart } from "../components/dashboard/Charts";
import { AlertBadge, Button, Card, CardHeader, ErrorState, KpiCard, SkeletonCard, Stagger } from "../components/ui";
import { useDashboard } from "../hooks/useDashboard";
import { useSession } from "../hooks/useSession";
import type { IndicatorCategory } from "../types/contracts";

const ENTITY_HINT: Record<string, string> = {
  SUDEBAN: "Suplantación regulatoria y captura de credenciales", BANCO_DEMO: "Fraude ejecutivo (BEC) y alertas apócrifas",
  PROVEEDOR: "Facturas falsas con adjuntos peligrosos", SENIAT: "Citaciones fiscales con archivos ejecutables",
  MESA_TI: "Avisos falsos de expiración de contraseñas", PRESIDENCIA: "Órdenes urgentes de la alta gerencia", OTRA: "Otras entidades",
};

export function DashboardPage() {
  const { data, error, reload } = useDashboard();
  const { user } = useSession();
  if (error) return <ErrorState text={error} onRetry={reload} />;
  if (!data) return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} lines={1} />)}</div>;
  const k = data.kpis;
  const isCiso = user?.role !== "ANALYST";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Correos analizados" value={k.emails_analyzed} hint={`% amenazas contenidas: ${k.threats_blocked_pct.toLocaleString("es-VE")}%`} icon={MailCheck} />
        <KpiCard label="En cuarentena" value={k.quarantined} hint="Aislados · clic para inspeccionar" icon={Lock} tone="critical" onClick={() => navigate("buzon")} />
        <KpiCard label="Enviados a spam" value={k.sent_to_spam} hint="Riesgo alto · clic para filtrar" icon={MailWarning} tone="high" onClick={() => navigate("buzon")} />
        <KpiCard label="Pendientes de revisión" value={k.pending_review} hint="Requieren decisión operativa" icon={Clock} tone="low" pulse onClick={() => navigate("buzon")} />
      </Stagger>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader title="Correos por nivel de riesgo" subtitle={`Puntaje promedio: ${k.avg_risk_score.toLocaleString("es-VE")}`} /><RiskDonut data={data.by_risk_level} /></Card>
        <Card><CardHeader title="Entidades más suplantadas" subtitle="Conteo por identidad afectada (riesgo alto y crítico)" />
          <HBars items={data.top_impersonated.map((t) => ({ label: t.entity, value: t.count, hint: ENTITY_HINT[t.entity] }))} color="var(--critical)" />
        </Card>
        <Card><CardHeader title="Correos vs. amenazas por hora" subtitle="Últimas 12 horas" /><TimelineChart points={data.timeline} /></Card>
        <Card><CardHeader title="Tipos de indicador" subtitle="Qué delata a los correos peligrosos" />
          <HBars items={(Object.entries(data.by_indicator_category) as [IndicatorCategory, number][]).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ label: CATEGORY[c]?.label ?? c, value: v }))} color="var(--sidebar)" />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {isCiso && (
          <Card>
            <CardHeader title="Casos prioritarios para triaje" subtitle="Correos en espera de decisión" action={<Button size="sm" variant="secondary" onClick={() => navigate("buzon")}>Ver todos en Buzón</Button>} />
            {data.review_queue.length === 0 ? <p className="text-sm text-ink-muted">No hay casos pendientes. ¡Bien!</p> : (
              <ul className="space-y-2">
                {data.review_queue.map((r) => (
                  <li key={r.email_id} className="lift flex items-center gap-3 rounded-control border border-line bg-surface-2 p-3">
                    <div className="min-w-0 flex-1">
                      <AlertBadge level={r.risk_score >= 80 ? "CRITICAL" : "HIGH"} score={r.risk_score} />
                      <p className="mt-1 truncate text-sm font-semibold text-ink">{r.subject}</p>
                      <p className="truncate font-mono text-[11px] text-ink-muted">{r.from_address}</p>
                    </div>
                    <Button size="sm" variant="navy" onClick={() => navigate("buzon")}>Revisar</Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        <Card className={isCiso ? "" : "xl:col-span-2"}>
          <CardHeader title="Últimos eventos" subtitle="Bitácora con hash encadenado"
            action={<span className={`inline-flex items-center gap-1 rounded-badge border px-2 py-0.5 text-xs font-semibold ${data.chain_ok ? "border-safe/40 bg-safe-soft text-safe" : "border-critical/40 bg-critical-soft text-critical"}`}>{data.chain_ok ? <ShieldCheck size={13} aria-hidden /> : <ShieldX size={13} aria-hidden />}{data.chain_ok ? "CADENA ÍNTEGRA" : "CADENA ALTERADA"}</span>} />
          <ul className="divide-y divide-line">
            {data.recent_events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="text-ink">{e.action_taken} · <span className="text-ink-muted">{e.actor}</span></span>
                <span className="font-mono text-[11px] text-ink-muted">{e.hash.slice(0, 10)}… · {new Date(e.created_at).toLocaleTimeString("es-VE")}</span>
              </li>
            ))}
            {data.recent_events.length === 0 && <li className="py-2 text-sm text-ink-muted">Sin eventos todavía.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
