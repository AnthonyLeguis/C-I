// [CAPA 2 — APLICACIÓN] Panel principal (PR G4). Función pura: recibe filas de D1 y arma el contrato
// de GET /api/v1/dashboard (PLAN_UX.md §4). Sin dependencias externas: fácil de probar.
import type { Folder, IndicatorCategory, RiskLevel } from "../domain/types";

export interface DashboardEmailRow {
  id: string;
  fromAddress: string;
  fromName: string | null;
  subject: string;
  receivedAt: string;
  folder: Folder;
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  indicators: unknown[];
  reviewStatus: string;
}

export interface DashboardAuditRow {
  id: string;
  createdAt: string;
  module: string;
  actor: string;
  riskLevel: RiskLevel | null;
  actionTaken: string;
  piiDetected: string[];
  aiUsed: boolean;
  hash: string;
}

export interface DashboardInput {
  emails: DashboardEmailRow[];
  audit: DashboardAuditRow[]; // ordenados del más reciente al más antiguo
  chainOk: boolean;
  now: Date;
}

const LEVELS: RiskLevel[] = ["SAFE", "LOW", "HIGH", "CRITICAL"];
const FOLDERS: Folder[] = ["INBOX", "SPAM", "QUARANTINE"];
const CATEGORIES: IndicatorCategory[] = ["REMITENTE", "AUTENTICACION", "ENLACES", "ADJUNTOS", "INGENIERIA_SOCIAL", "DATOS_PERSONALES"];

/** Entidad suplantada que se infiere del remitente (nombre visible o dominio). Solo correos de riesgo ALTO o CRÍTICO. */
const ENTITIES: { entity: string; pattern: RegExp }[] = [
  { entity: "SUDEBAN", pattern: /sudeban/i },
  { entity: "SENIAT", pattern: /seniat|tributari/i },
  { entity: "BANCO_DEMO", pattern: /banco-?demo|bancodemo/i },
  { entity: "MESA_TI", pattern: /soporte|mesa de ayuda|help ?desk|it-?support|autenticaci/i },
  { entity: "PROVEEDOR", pattern: /proveedor|factura|cobranza|servicios/i },
  { entity: "PRESIDENCIA", pattern: /presiden|gerencia|direcci[oó]n general|ceo/i },
];

export function inferEntity(fromName: string | null, fromAddress: string): string {
  const text = `${fromName ?? ""} ${fromAddress}`;
  return ENTITIES.find((e) => e.pattern.test(text))?.entity ?? "OTRA";
}

function categoryOf(indicator: unknown): IndicatorCategory | null {
  if (typeof indicator !== "object" || indicator === null) return null;
  const c = (indicator as { category?: unknown }).category;
  return typeof c === "string" && (CATEGORIES as string[]).includes(c) ? (c as IndicatorCategory) : null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function buildDashboard({ emails, audit, chainOk, now }: DashboardInput) {
  const analyzed = emails.filter((e) => e.riskLevel !== null);
  const byRisk = Object.fromEntries(LEVELS.map((l) => [l, analyzed.filter((e) => e.riskLevel === l).length])) as Record<RiskLevel, number>;
  const byFolder = Object.fromEntries(FOLDERS.map((f) => [f, emails.filter((e) => e.folder === f).length])) as Record<Folder, number>;

  const byCategory: Partial<Record<IndicatorCategory, number>> = {};
  for (const e of emails) for (const ind of e.indicators) {
    const c = categoryOf(ind);
    if (c) byCategory[c] = (byCategory[c] ?? 0) + 1;
  }

  const threats = byRisk.HIGH + byRisk.CRITICAL;
  const scores = analyzed.map((e) => e.riskScore ?? 0);

  const entityCount = new Map<string, number>();
  for (const e of analyzed) {
    if (e.riskLevel !== "HIGH" && e.riskLevel !== "CRITICAL") continue;
    const ent = inferEntity(e.fromName, e.fromAddress);
    entityCount.set(ent, (entityCount.get(ent) ?? 0) + 1);
  }

  // Línea de tiempo: últimas 12 horas, agrupadas por hora (UTC).
  const timeline = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(now.getTime() - (11 - i) * 3_600_000);
    start.setUTCMinutes(0, 0, 0);
    const end = start.getTime() + 3_600_000;
    const inHour = analyzed.filter((e) => { const t = Date.parse(e.receivedAt); return t >= start.getTime() && t < end; });
    return { hour: start.toISOString(), total: inHour.length, threats: inHour.filter((e) => e.riskLevel === "HIGH" || e.riskLevel === "CRITICAL").length };
  });

  const recentAi = audit.find((a) => now.getTime() - Date.parse(a.createdAt) <= 5 * 60_000 && (a.module === "MAIL_ANALYZER" || a.module === "ASSISTANT_GUARD"));
  const aiStatus = recentAi ? (recentAi.aiUsed ? "ONLINE" : "FALLBACK") : "UNKNOWN";

  return {
    generated_at: now.toISOString(),
    kpis: {
      emails_analyzed: analyzed.length,
      quarantined: byFolder.QUARANTINE,
      sent_to_spam: byFolder.SPAM,
      pending_review: emails.filter((e) => e.reviewStatus === "PENDING").length,
      threats_blocked_pct: analyzed.length ? round1((threats / analyzed.length) * 100) : 0,
      avg_risk_score: scores.length ? round1(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      pii_protected: audit.filter((a) => a.piiDetected.length > 0).length,
      blocked_assistant_requests: audit.filter((a) => a.module === "ASSISTANT_GUARD" && a.actionTaken === "BLOCKED").length,
    },
    by_risk_level: byRisk,
    by_folder: byFolder,
    by_indicator_category: byCategory,
    top_impersonated: [...entityCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([entity, count]) => ({ entity, count })),
    timeline,
    review_queue: emails
      .filter((e) => e.reviewStatus === "PENDING")
      .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
      .slice(0, 5)
      .map((e) => ({ email_id: e.id, subject: e.subject, from_address: e.fromAddress, risk_score: e.riskScore ?? 0, received_at: e.receivedAt })),
    recent_events: audit.slice(0, 10).map((a) => ({ id: a.id, created_at: a.createdAt, module: a.module, actor: a.actor, risk_level: a.riskLevel, action_taken: a.actionTaken, hash: a.hash })),
    chain_ok: chainOk,
    ai_status: aiStatus as "ONLINE" | "FALLBACK" | "UNKNOWN",
  };
}
