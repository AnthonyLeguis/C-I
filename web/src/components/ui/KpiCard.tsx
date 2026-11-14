// Tarjeta KPI con número animado (PR X2 · PLAN_UX §4.1).
import type { LucideIcon } from "lucide-react";
import { Eyebrow } from "./Card";
import { CountUp } from "./motion";

type Tone = "navy" | "critical" | "high" | "low" | "safe";
const TONE: Record<Tone, { accent: string; text: string }> = {
  navy: { accent: "var(--sidebar)", text: "text-ink" },
  critical: { accent: "var(--critical)", text: "text-critical" },
  high: { accent: "var(--high)", text: "text-high" },
  low: { accent: "var(--low)", text: "text-ink" },
  safe: { accent: "var(--safe)", text: "text-safe" },
};

export interface KpiCardProps {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
  decimals?: number;
  suffix?: string;
  pulse?: boolean;
  onClick?: () => void;
}

export function KpiCard({ label, value, hint, icon: Icon, tone = "navy", decimals = 0, suffix = "", pulse = false, onClick }: KpiCardProps) {
  const t = TONE[tone];
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{ borderTopColor: t.accent }}
      className={`flex w-full flex-col rounded-card border border-line border-t-[3px] bg-surface p-5 text-left shadow-card ${onClick ? "lift press cursor-pointer focus-visible:outline-2 focus-visible:outline-brand" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Eyebrow>{label}</Eyebrow>
        <Icon size={18} style={{ color: t.accent }} aria-hidden />
      </div>
      <div className={`mt-2 flex items-center gap-2 text-4xl font-bold ${t.text}`}>
        <CountUp value={value} decimals={decimals} suffix={suffix} />
        {pulse && value > 0 && <span className="h-2 w-2 rounded-full bg-high animate-ci-pulse" aria-hidden />}
      </div>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </Tag>
  );
}
