// MÓDULO ELIMINABLE "timeline-qa" (Anthony): avance de cada desarrollador según los PR que llegaron a
// `development` tras pasar QA, y línea de tiempo de los PR que faltan. Se refresca solo cada 30 s.
import { CheckCircle2, CircleDashed, GitPullRequest, Hourglass, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, CountUp, ErrorState, Eyebrow, Logo, PageTransition, SkeletonCard, Stagger, ThemeToggle } from "../components/ui";
import { api } from "../services/apiClient";
import type { TimelineDeveloper, TimelinePointStatus, TimelineQaResponse } from "../types/contracts";

const STATUS: Record<TimelinePointStatus, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  DEVELOPMENT: { label: "En development", cls: "text-safe bg-safe-soft border-safe/40", icon: CheckCircle2 },
  QA: { label: "En QA · espera promoción", cls: "text-low bg-low-soft border-low/40", icon: Hourglass },
  PR_ABIERTO: { label: "PR abierto", cls: "text-high bg-high-soft border-high/40", icon: GitPullRequest },
  PENDIENTE: { label: "Pendiente", cls: "text-ink-muted bg-surface-2 border-line-strong", icon: CircleDashed },
};
const BAR = ["var(--series-1)", "var(--series-2)", "var(--series-5)"];

export function TimelineQa() {
  const [data, setData] = useState<TimelineQaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.timelineQa().then((d) => { setData(d); setError(null); }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-44" />
          <div>
            <h1 className="text-2xl font-bold text-ink">Avance del equipo · timeline-qa</h1>
            <p className="text-sm text-ink-muted">Solo cuentan los PR que pasaron QA y llegaron a <span className="font-mono">development</span>.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} className="press inline-flex items-center gap-1 rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-2"><RefreshCw size={15} aria-hidden /> Actualizar</button>
          <ThemeToggle />
        </div>
      </header>

      {error && <ErrorState text={error} onRetry={load} />}
      {!data && !error && <div className="grid gap-4 md:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
      {data && (
        <PageTransition className="space-y-6">
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Eyebrow>Avance total del equipo</Eyebrow>
              <p className="text-4xl font-bold text-ink"><CountUp value={data.team.percent} suffix="%" /></p>
              <p className="text-sm text-ink-muted">{data.team.done} de {data.team.total} puntos en development</p>
            </div>
            <p className="font-mono text-xs text-ink-muted">development @ {data.development_sha} · actualizado {new Date(data.stored_at.endsWith("Z") ? data.stored_at : `${data.stored_at}Z`).toLocaleString("es-VE")}</p>
          </Card>
          <Stagger className="grid gap-4 md:grid-cols-3">
            {data.developers.map((d, i) => <DevCard key={d.id} dev={d} color={BAR[i % BAR.length] ?? "var(--brand)"} />)}
          </Stagger>
          <Card>
            <h2 className="text-lg font-semibold text-ink">Línea de tiempo · PR que faltan por llegar a development</h2>
            <p className="mb-4 text-sm text-ink-muted">Ordenados por el checkpoint objetivo del plan.</p>
            <Stagger className="grid gap-6 lg:grid-cols-3">
              {data.developers.map((d) => <Pending key={d.id} dev={d} />)}
            </Stagger>
          </Card>
        </PageTransition>
      )}
    </main>
  );
}

function DevCard({ dev, color }: { dev: TimelineDeveloper; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setW(dev.percent)); return () => cancelAnimationFrame(id); }, [dev.percent]);
  return (
    <Card className="lift h-full">
      <Eyebrow>@{dev.github}</Eyebrow>
      <p className="mt-1 font-semibold text-ink">{dev.name}</p>
      <p className="mt-3 text-4xl font-bold" style={{ color }}><CountUp value={dev.percent} suffix="%" /></p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={dev.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Avance de ${dev.name}`}>
        <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${w}%`, background: color }} />
      </div>
      <p className="mt-2 text-sm text-ink-muted">{dev.done} de {dev.total} puntos completados</p>
    </Card>
  );
}

function Pending({ dev }: { dev: TimelineDeveloper }) {
  const items = dev.points.filter((p) => p.status !== "DEVELOPMENT");
  return (
    <section>
      <p className="mb-3 font-semibold text-ink">{dev.name}</p>
      {items.length === 0 ? (
        <p className="rounded-control border border-safe/40 bg-safe-soft px-3 py-2 text-sm font-semibold text-safe">¡Todo en development! 🎉</p>
      ) : (
        <ol className="relative space-y-3 border-l-2 border-line pl-5">
          {items.map((p) => {
            const s = STATUS[p.status];
            const Icon = s.icon;
            return (
              <li key={p.code} className="relative">
                <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-surface bg-line-strong" aria-hidden />
                <p className="text-sm font-semibold text-ink"><span className="font-mono">{p.code}</span> · {p.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-badge border px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}><Icon size={12} aria-hidden /> {s.label}</span>
                  <span className="font-mono text-[11px] text-ink-muted">objetivo {p.cp}</span>
                  {p.detail?.url && <a href={p.detail.url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-ai underline">PR #{p.detail.number}</a>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
