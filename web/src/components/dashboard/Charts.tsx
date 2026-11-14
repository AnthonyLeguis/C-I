// Gráficas livianas del Panel (PR G6) sin librerías: dona por nivel, barras horizontales y línea de tiempo.
import { useEffect, useState } from "react";
import type { RiskLevel } from "../../types/contracts";
import { RISK } from "../ui";

const LEVELS: RiskLevel[] = ["SAFE", "LOW", "HIGH", "CRITICAL"];

/** Dona con conic-gradient; gira suavemente al cargar. */
export function RiskDonut({ data }: { data: Record<RiskLevel, number> }) {
  const total = LEVELS.reduce((n, l) => n + data[l], 0);
  let acc = 0;
  const stops = LEVELS.map((l) => {
    const from = total ? (acc / total) * 100 : 0;
    acc += data[l];
    const to = total ? (acc / total) * 100 : 0;
    return `${RISK[l].color} ${from}% ${to}%`;
  }).join(", ");
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-36 w-36 shrink-0 animate-enter rounded-full" style={{ background: total ? `conic-gradient(${stops})` : "var(--surface-2)" }} role="img" aria-label="Correos por nivel de riesgo">
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-surface">
          <span className="text-2xl font-bold text-ink tabular">{total}</span>
          <span className="text-[11px] text-ink-muted">correos</span>
        </div>
      </div>
      <ul className="min-w-[160px] flex-1 space-y-2">
        {LEVELS.map((l) => (
          <li key={l} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-ink-2"><span className="h-3 w-3 rounded-sm" style={{ background: RISK[l].color }} aria-hidden />{RISK[l].label}</span>
            <span className="font-mono tabular text-ink">{data[l]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras horizontales que crecen al montar. */
export function HBars({ items, color = "var(--sidebar)" }: { items: { label: string; value: number; hint?: string }[]; color?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(id); }, []);
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="text-sm text-ink-muted">Sin datos todavía.</p>;
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex justify-between gap-2 text-sm"><span className="font-semibold text-ink">{i.label}</span><span className="font-mono tabular text-ink-2">{i.value}</span></div>
          {i.hint && <p className="text-xs text-ink-muted">{i.hint}</p>}
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: ready ? `${(i.value / max) * 100}%` : "0%", background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Línea de tiempo (SVG): total de correos vs. amenazas por hora. */
export function TimelineChart({ points }: { points: { hour: string; total: number; threats: number }[] }) {
  const W = 560, H = 160, P = 24;
  const max = Math.max(1, ...points.map((p) => p.total));
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, points.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const path = (k: "total" | "threats") => points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" role="img" aria-label="Correos y amenazas por hora">
        {[0, 0.5, 1].map((t) => <line key={t} x1={P} x2={W - P} y1={y(max * t)} y2={y(max * t)} stroke="var(--grid)" />)}
        <path d={path("total")} fill="none" stroke="var(--low)" strokeWidth={2.5} className="animate-enter" />
        <path d={path("threats")} fill="none" stroke="var(--critical)" strokeWidth={2.5} className="animate-enter" />
        {points.map((p, i) => i % 3 === 0 && (
          <text key={p.hour} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--ink-muted)">{new Date(p.hour).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}</text>
        ))}
      </svg>
      <div className="flex gap-4 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded bg-low" aria-hidden /> Correos</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded bg-critical" aria-hidden /> Amenazas</span>
      </div>
    </div>
  );
}
