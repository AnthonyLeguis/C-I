// Bitácora de Eventos (PR G6 · PLAN_UX §5.6): tabla en consola, filtros, verificar integridad (Master) y CSV.
import { Download, Search, ShieldCheck, ShieldX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AlertBadge, Button, ErrorState, Skeleton, useToast } from "../components/ui";
import { useSession } from "../hooks/useSession";
import { api } from "../services/apiClient";
import type { AuditEventsResponse } from "../types/contracts";

const MODULES = ["", "MAIL_ANALYZER", "REVIEW", "ASSISTANT_GUARD", "AUTH"];
const LEVELS = ["", "CRITICAL", "HIGH", "LOW", "SAFE"];

export function AuditLogPage() {
  const { user } = useSession();
  const toast = useToast();
  const [filters, setFilters] = useState({ module: "", level: "", q: "" });
  const [data, setData] = useState<AuditEventsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chain, setChain] = useState<{ ok: boolean; total: number; broken: string | null } | null>(null);

  const load = useCallback(() => {
    api.auditEvents(filters).then((d) => { setData(d); setError(null); }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"));
  }, [filters]);
  useEffect(() => { const id = window.setTimeout(load, 250); return () => window.clearTimeout(id); }, [load]);

  const verify = async () => {
    try {
      const r = await api.verifyAudit();
      setChain({ ok: r.chain_ok, total: r.total, broken: r.broken_at });
      toast.notify(r.chain_ok ? "success" : "error", r.chain_ok ? `Cadena íntegra · ${r.total} registros` : "¡Cadena alterada!", r.broken_at ? `Ruptura en ${r.broken_at}` : undefined);
    } catch { toast.notify("error", "Solo el Master puede verificar la integridad"); }
  };

  const ok = chain?.ok ?? true;
  return (
    <div className="mx-auto max-w-7xl rounded-card bg-console p-5 text-slate-200 shadow-card sm:p-6">
      <h2 className="text-lg font-semibold text-white">Bitácora inmutable de auditoría y acciones</h2>
      <p className="text-sm text-slate-400">Registro cronológico encadenado por hash SHA-256 de decisiones humanas y eventos del sistema.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-badge border px-2.5 py-1 font-mono text-xs font-semibold ${ok ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/50 bg-red-500/10 text-red-300"}`}>
          {ok ? <ShieldCheck size={14} aria-hidden /> : <ShieldX size={14} aria-hidden />} {chain ? (ok ? `CADENA ÍNTEGRA · ${chain.total} REGISTROS` : "CADENA ALTERADA") : `${data?.total ?? 0} REGISTROS`}
        </span>
        {user?.role === "ADMIN" && <Button size="sm" variant="secondary" icon={<ShieldCheck size={15} />} onClick={() => void verify()}>Verificar integridad</Button>}
        <a href={api.auditCsvUrl} className="press inline-flex h-8 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-xs font-semibold text-ink" download><Download size={15} aria-hidden /> Exportar CSV</a>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="relative block text-xs text-slate-400">Buscar evento, actor o hash
          <Search size={15} className="absolute left-3 top-[34px] text-slate-500" aria-hidden />
          <input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Ej. SUDEBAN, Sofía, a3f9…" className="mt-1 w-full rounded-control border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-ai focus:outline-none" />
        </label>
        <label className="text-xs text-slate-400">Módulo
          <select value={filters.module} onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value }))} className="mt-1 w-full rounded-control border border-white/10 bg-console px-3 py-2 text-sm text-white">{MODULES.map((m) => <option key={m} value={m}>{m || "Todos los módulos"}</option>)}</select>
        </label>
        <label className="text-xs text-slate-400">Nivel
          <select value={filters.level} onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))} className="mt-1 w-full rounded-control border border-white/10 bg-console px-3 py-2 text-sm text-white">{LEVELS.map((l) => <option key={l} value={l}>{l || "Todos los niveles"}</option>)}</select>
        </label>
      </div>

      {error && <div className="mt-4"><ErrorState text={error} onRetry={load} /></div>}
      {!data && !error && <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
      {data && (
        <div className="mt-4 overflow-x-auto rounded-control border border-white/10">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <tr><th className="p-3">Fecha y hora</th><th className="p-3">Módulo</th><th className="p-3">Actor</th><th className="p-3">Nivel</th><th className="p-3">Acción registrada</th><th className="p-3">Hash</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.events.map((e, i) => (
                <tr key={e.id} className="animate-enter hover:bg-white/5" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <td className="whitespace-nowrap p-3 font-mono text-xs">{new Date(e.created_at).toLocaleString("es-VE")}</td>
                  <td className="p-3 font-mono text-xs">{e.module}</td>
                  <td className="p-3">{e.actor}</td>
                  <td className="p-3">{e.risk_level ? <AlertBadge level={e.risk_level} /> : <span className="text-slate-500">—</span>}</td>
                  <td className="max-w-[340px] p-3"><span className="font-semibold">{e.action_taken}</span>{e.xai_explanation && <p className="line-clamp-2 text-xs text-slate-400" title={e.xai_explanation}>{e.xai_explanation}</p>}</td>
                  <td className="p-3"><button type="button" title="Copiar hash" onClick={() => { void navigator.clipboard?.writeText(e.hash); toast.notify("info", "Hash copiado", e.hash.slice(0, 24)); }} className="font-mono text-xs text-ai hover:underline">{e.hash.slice(0, 10)}…</button></td>
                </tr>
              ))}
              {data.events.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">No hay eventos con esos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
