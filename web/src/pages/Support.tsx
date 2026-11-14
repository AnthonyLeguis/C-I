// Consola de Soporte (PR A6 · solo Master, prototipo de Alejandro): estado, modo de IA, restablecer demo y dominios bloqueados.
import { Database, Mail, RefreshCw, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button, Card, CardHeader, ErrorState, Eyebrow, SkeletonCard, prettyModel, useToast } from "../components/ui";
import { api } from "../services/apiClient";
import type { BlockedDomainDto, SupportStatus } from "../types/contracts";

function Row({ icon, title, desc, right }: { icon: ReactNode; title: string; desc: ReactNode; right: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-line py-4 last:border-0">
      <span className="flex h-10 w-10 items-center justify-center rounded-control bg-surface-2 text-ink-2">{icon}</span>
      <div className="min-w-[180px] flex-1"><p className="font-semibold text-ink">{title}</p><p className="text-sm text-ink-muted">{desc}</p></div>
      {right}
    </div>
  );
}
const Pill = ({ ok, children }: { ok: boolean; children: ReactNode }) => (
  <span className={`rounded-badge border px-2 py-0.5 text-xs font-semibold ${ok ? "border-safe/40 bg-safe-soft text-safe" : "border-high/40 bg-high-soft text-high"}`}>{children}</span>
);

export function SupportPage() {
  const toast = useToast();
  const [status, setStatus] = useState<SupportStatus | null>(null);
  const [domains, setDomains] = useState<BlockedDomainDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([api.supportStatus(), api.blockedDomains()])
      .then(([s, d]) => { setStatus(s); setDomains(d.domains); setError(null); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"));
  }, []);
  useEffect(load, [load]);

  const run = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    try { toast.notify("success", await fn()); load(); }
    catch (e: unknown) { toast.notify("error", e instanceof Error ? e.message : "No se pudo completar"); }
    finally { setBusy(null); }
  };

  if (error) return <ErrorState text={error} onRetry={load} />;
  if (!status) return <SkeletonCard lines={6} />;
  const rules = status.ai.mode === "RULES";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader title="Estado de infraestructura y motor IA" subtitle="Control técnico exclusivo del Master / Soporte Técnico"
          action={<Button size="sm" variant="secondary" icon={<RefreshCw size={14} />} onClick={load}>Actualizar</Button>} />
        <Row icon={<Sparkles size={18} />} title={`Motor de explicación IA (${prettyModel(status.ai.model)})`}
          desc={rules ? "Modo reglas: la IA está apagada y el sistema usa solo el motor determinista." : `En línea · respaldo ${prettyModel(status.ai.fallback_model)} · guardián ${prettyModel(status.ai.guard_model)}`}
          right={<div className="flex items-center gap-2"><Pill ok={!rules}>{rules ? "MODO REGLAS" : status.ai.binding ? "EN LÍNEA" : "SIN IA (OFFLINE)"}</Pill>
            <Button size="sm" variant={rules ? "primary" : "secondary"} loading={busy === "mode"}
              onClick={() => void run("mode", async () => { const r = await api.setAiMode(rules ? "ONLINE" : "RULES"); return r.mode === "RULES" ? "Modo reglas activado · registrado en bitácora" : "IA en línea · registrado en bitácora"; })}>
              {rules ? "Volver a IA en línea" : "Cambiar a modo reglas"}</Button></div>} />
        <Row icon={<Database size={18} />} title="Base de datos de auditoría (D1)"
          desc={<>Latencia: <span className="font-mono">{status.database.latency_ms} ms</span> · {status.database.emails} correos · {status.database.events} eventos</>}
          right={<Pill ok={status.database.ok}>OPERATIVO</Pill>} />
        <Row icon={<Mail size={18} />} title="Ingesta de correo" desc={status.mail_ingestion.source} right={<Pill ok={status.mail_ingestion.ok}>CONECTADO</Pill>} />
        <Row icon={<RotateCcw size={18} />} title="Restablecer entorno de demostración" desc="Borra correos, bitácora y bloqueos, y vuelve a cargar los 6 escenarios de demo."
          right={<Button size="sm" variant="danger" loading={busy === "reset"}
            onClick={() => { if (window.confirm("¿Restablecer la demo? Se borrarán correos, bitácora y dominios bloqueados.")) void run("reset", async () => `Demo restablecida · ${(await api.resetDemo(true)).loaded} correos cargados`); }}>Restablecer datos</Button>} />
      </Card>

      <Card>
        <CardHeader title="Lista corporativa de dominios bloqueados" subtitle="Sincronizada con el Buzón y el Analizador"
          action={<span className="rounded-badge border border-critical/40 bg-critical-soft px-2 py-0.5 text-xs font-semibold text-critical">{domains.length} BLOQUEADOS</span>} />
        {domains.length === 0 ? <p className="text-sm text-ink-muted">No hay dominios bloqueados.</p> : (
          <ul className="space-y-2">
            {domains.map((d) => (
              <li key={d.domain} className="flex flex-wrap items-center gap-3 rounded-control border border-line bg-surface-2 p-3">
                <div className="min-w-[200px] flex-1">
                  <p className="font-mono text-sm text-critical">{d.domain}</p>
                  <Eyebrow className="mt-1">{d.reason} · por {d.blocked_by} · {new Date(d.created_at).toLocaleString("es-VE")}</Eyebrow>
                </div>
                <Button size="sm" variant="secondary" icon={<Trash2 size={14} />} loading={busy === d.domain}
                  onClick={() => void run(d.domain, async () => `Bloqueo retirado: ${(await api.unblockDomain(d.domain)).domain}`)}>Retirar bloqueo</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
