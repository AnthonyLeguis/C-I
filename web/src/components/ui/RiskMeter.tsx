// Medidor de riesgo 0–100 con las 4 zonas y marcador ▲ animado (PR X2 · PLAN_UX §3.1 y §1.1).
import { useEffect, useState } from "react";
import { AlertBadge } from "./Badges";
import { Eyebrow } from "./Card";
import { levelFromScore, RISK } from "./levels";
import { CountUp } from "./motion";

const ZONES = (["SAFE", "LOW", "HIGH", "CRITICAL"] as const).map((lvl) => {
  const [a, b] = RISK[lvl].range;
  return { lvl, width: b - a + 1, color: RISK[lvl].color };
});

export function RiskMeter({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const level = levelFromScore(clamped);
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPos(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  return (
    <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped} aria-label={`Nivel de riesgo ${clamped} de 100, ${RISK[level].label}`}>
      {showLabel && (
        <div className="mb-2 flex items-end justify-between gap-3">
          <Eyebrow>Nivel de riesgo (0-100)</Eyebrow>
          <div className="flex items-center gap-2">
            <CountUp value={clamped} className="text-3xl font-bold leading-none" />
            <AlertBadge level={level} />
          </div>
        </div>
      )}
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {ZONES.map((z) => (
          <span key={z.lvl} style={{ flexGrow: z.width, background: z.color, opacity: z.lvl === level ? 1 : 0.55 }} />
        ))}
      </div>
      <div className="relative h-3">
        <span
          aria-hidden
          className="absolute top-0.5 -translate-x-1/2 text-[10px] leading-none text-ink transition-[left] duration-700 ease-out"
          style={{ left: `${pos}%` }}
        >
          ▲
        </span>
      </div>
    </div>
  );
}
