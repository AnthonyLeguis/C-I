// Consola de Soporte (PR A6 · Anthony · PLAN_UX §5 y captura 14 del prototipo). Solo Master / Soporte Técnico.
// Estado de la IA y de D1, cambio a "modo reglas", restablecer la demo y lista de dominios bloqueados (usa G7).
import { Bot, Database, Inbox, RotateCcw, ShieldBan } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button, Card, CardHeader, EmptyState, ErrorState, ForbiddenState, Skeleton, prettyModel, useToast } from "../components/ui";
import { useSession } from "../hooks/useSession";
import { api } from "../services/apiClient";
import type { BlockedDomainDto, SupportStatus } from "../types/contracts";

const pill = (tone: "ok" | "warn" | "bad" | "info") =>
  `inline-flex items-center rounded-badge border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${
    { ok: "border-safe/40 bg-safe-soft text-safe", warn: "border-high/40 bg-high-soft text-high", bad: "border-critical/40 bg-critical-soft text-critical", info: "border-ai/40 bg-surface-2 text-ai" }[tone]
  }`;

function Row({ icon, title, text, action }: { icon: ReactNode; title: string; text: ReactNode; action: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 text-ink-muted" aria-hidden>{icon}</span>
        <div className="min-w-0">
          <p className="font-semibold text-ink">{title}</p>
          <p className="text-sm text-ink-muted">{text}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function SupportPage() {
  const { user } = useSession();
  const toast = useToast();
  const [status, setStatus] = useState<SupportStatus | null>(null);
  const [domains, setDomains] = useState<BlockedDomainDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"mode" | "reset" | string | null>(null);

  const load = useCallback(() => {
    Promise.all([api.supportStatus(), api.blockedDomains()])
      .then(([s, d]) => { setStatus(s); setDomains(d.domains); setError(null); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"));
  }, []);
  useEffect(() => { if (user?.role === "ADMIN") load(); }, [load, user?.role]);

  if (user?.role !== "ADMIN") return <div className="mx-auto max-w-3xl"><ForbiddenState /></div>;

  const toggleMode = async () => {
    if (!status) return;
    const next = status.mode === "ONLINE" ? "RULES_ONLY" : "ONLINE";
    setBusy("mode");
    try {
      await api.setSupportMode(next);
      toast.notify("success", next === "RULES_ONLY" ? "Modo reglas activado: la IA quedó apagada" : "IA en línea de nuevo", "Registrado en la bitácora");
      load();
    } catch (e) { toast.notify("error", e instanceof Error ? e.message : "No se pudo cambiar el modo"); }
    finally { setBusy(null); }
  };

  const reset = async () => {
    if (!window.confirm("¿Restablecer la demo? Se recarga el buzón sintético, se retiran los dominios bloqueados y la IA vuelve a estar en línea. La bitácora se conserva.")) return;
    setBusy("reset");
    try {
      const r = await api.resetDemo();
      toast.notify("success", `Demo restablecida · ${r.emails} correos`, `hash ${r.audit_hash.slice(0, 8)}…`);
      load();
    } catch (e) { toast.notify("error", e instanceof Error ? e.message : "No se pudo restablecer la demo"); }
    finally { setBusy(null); }
  };

  const unblock = async (domain: string) => {
    setBusy(domain);
    try { await api.unblockDomain(domain); toast.notify("success", `Bloqueo retirado: ${domain}`); load(); }
    catch (e) { toast.notify("error", e instanceof Error ? e.message : "No se pudo retirar el bloqueo"); }
    finally { setBusy(null); }
  };

  if (error) return <div className="mx-auto max-w-4xl"><ErrorState text={error} onRetry={load} /></div>;
  if (!status || !domains) return <div className="mx-auto max-w-4xl space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  const ai = status.ai;
  const aiText = ai.status === "EN_LINEA"
    ? `En línea con ${prettyModel(ai.model ?? "")}: reglas 70 % + IA 30 %`
    : ai.status === "APAGADA" ? "Apagada: decide solo el motor de reglas (respaldo determinista)"
    : "Workers AI no está conectado en este entorno (offline): decide el motor de reglas";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader title="Estado de infraestructura y motor IA" subtitle="Control técnico exclusivo para Master / Soporte Técnico" action={<span className={pill("info")}>Solo Master</span>} />
        <Row icon={<Bot size={18} />} title="Motor de explicación IA" text={aiText}
          action={ai.bound
            ? <Button size="sm" variant={status.mode === "ONLINE" ? "secondary" : "success"} loading={busy === "mode"} onClick={() => void toggleMode()}>
                {status.mode === "ONLINE" ? "Cambiar a modo reglas" : "Volver a IA en línea"}
              </Button>
            : <span className={pill("warn")}>Sin IA</span>} />
        <Row icon={<Database size={18} />} title="Base de datos de auditoría (D1)"
          text={status.database.ok
            ? <>Consulta en <span className="font-mono">{status.database.latency_ms} ms</span> · {status.database.emails} correos · {status.database.audit_events} eventos en bitácora</>
            : "No responde"}
          action={<span className={pill(status.database.ok ? "ok" : "bad")}>{status.database.ok ? "Operativo" : "Caída"}</span>} />
        <Row icon={<Inbox size={18} />} title="Ingesta de correo" text="Buzón institucional simulado con correos sintéticos. La conexión a Exchange, Microsoft 365, Gmail o Zimbra está en el roadmap."
          action={<span className={pill("info")}>Simulado</span>} />
        <Row icon={<RotateCcw size={18} />} title="Restablecer entorno de demostración" text="Recarga el buzón sintético, retira los bloqueos y enciende la IA. La bitácora no se borra (su cadena debe seguir íntegra)."
          action={<Button size="sm" variant="danger" loading={busy === "reset"} onClick={() => void reset()}>Restablecer datos</Button>} />
      </Card>

      <Card>
        <CardHeader title="Lista corporativa de dominios bloqueados" subtitle="Bloqueos hechos por el CISO desde el Analizador de Casos"
          action={<span className={pill(domains.length ? "bad" : "ok")}>{domains.length} bloqueados</span>} />
        {domains.length === 0
          ? <EmptyState icon={ShieldBan} title="Sin dominios bloqueados" text="Cuando el CISO bloquee un dominio desde un caso, aparecerá aquí." />
          : <ul className="space-y-3">
              {domains.map((d) => (
                <li key={d.domain} className="rounded-control border border-line bg-surface-2 p-4">
                  <p className="font-mono text-sm font-semibold text-critical">{d.domain}</p>
                  <p className="mt-1 text-sm text-ink-muted">{d.reason} · Por {d.blocked_by} ({new Date(d.created_at.endsWith("Z") ? d.created_at : `${d.created_at}Z`).toLocaleString("es-VE")})</p>
                  <Button className="mt-3" size="sm" variant="secondary" loading={busy === d.domain} onClick={() => void unblock(d.domain)}>Retirar bloqueo</Button>
                </li>
              ))}
            </ul>}
      </Card>
    </div>
  );
}
