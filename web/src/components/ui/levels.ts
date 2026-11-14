// Fuente única de niveles, carpetas y estados (PLAN_UX §3). Todos los componentes leen de aquí.
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock, Inbox, Info, Lock, MailWarning, ShieldAlert, ShieldCheck, Undo2, type LucideIcon } from "lucide-react";
import type { Folder, ReviewStatus, RiskLevel } from "../../types/contracts";

export interface VisualSpec {
  label: string;
  icon: LucideIcon;
  /** clases de texto + fondo suave + borde */
  tone: string;
  /** variable CSS del color sólido (para medidor, destellos y gráficos) */
  color: string;
}

export const RISK: Record<RiskLevel, VisualSpec & { range: [number, number]; message: string }> = {
  SAFE: { label: "SEGURO", icon: ShieldCheck, tone: "text-safe bg-safe-soft border-safe/40", color: "var(--safe)", range: [0, 19], message: "Sin señales de amenaza" },
  LOW: { label: "BAJO", icon: Info, tone: "text-low bg-low-soft border-low/40", color: "var(--low)", range: [20, 49], message: "Revise con atención antes de responder" },
  HIGH: { label: "ALTO", icon: AlertTriangle, tone: "text-high bg-high-soft border-high/40", color: "var(--high)", range: [50, 79], message: "Posible phishing: no abra enlaces ni adjuntos" },
  CRITICAL: { label: "CRÍTICO", icon: ShieldAlert, tone: "text-critical bg-critical-soft border-critical/40", color: "var(--critical)", range: [80, 100], message: "Amenaza detectada por reglas: aislado" },
};

export const FOLDER: Record<Folder, VisualSpec> = {
  INBOX: { label: "Bandeja", icon: Inbox, tone: "text-ink-2 bg-surface-2 border-line-strong", color: "var(--ink-2)" },
  SPAM: { label: "Spam", icon: MailWarning, tone: "text-high bg-high-soft border-high/40", color: "var(--high)" },
  QUARANTINE: { label: "Cuarentena", icon: Lock, tone: "text-critical bg-critical-soft border-critical/40", color: "var(--critical)" },
};

export const REVIEW: Record<Exclude<ReviewStatus, "N/A">, VisualSpec> = {
  PENDING: { label: "PENDIENTE DE REVISIÓN", icon: Clock, tone: "text-high bg-high-soft border-high/40", color: "var(--high)" },
  CONFIRMED: { label: "AMENAZA CONFIRMADA", icon: CheckCircle2, tone: "text-critical bg-critical-soft border-critical/40", color: "var(--critical)" },
  RESTORED: { label: "RESTAURADO", icon: Undo2, tone: "text-safe bg-safe-soft border-safe/40", color: "var(--safe)" },
};

export const ESCALATED: VisualSpec = { label: "ESCALADO A CISO", icon: ArrowUpRight, tone: "text-escalated bg-escalated-soft border-escalated/40", color: "var(--escalated)" };

export const ROLE_LABEL = { ANALYST: "Analista de Seguridad", SUPERVISOR: "Gerente de Seguridad (CISO)", ADMIN: "Master / Soporte Técnico" } as const;

export function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 20) return "LOW";
  return "SAFE";
}
