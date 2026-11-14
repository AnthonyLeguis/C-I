// [CAPA 3 — INFRAESTRUCTURA] Lecturas de D1 para el panel (PR G4).
import type { DashboardAuditRow, DashboardEmailRow } from "../application/dashboard";
import type { Folder, RiskLevel } from "../domain/types";
import { AuditRepository } from "./d1Repos";

const parseArray = (raw: unknown): unknown[] => {
  if (typeof raw !== "string") return [];
  try { const v: unknown = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
};

export async function loadDashboardData(db: D1Database): Promise<{ emails: DashboardEmailRow[]; audit: DashboardAuditRow[]; chainOk: boolean }> {
  const [emailRes, auditRes, chain] = await Promise.all([
    db.prepare(
      "SELECT id, from_address, from_name, subject, received_at, folder, risk_level, risk_score, indicators, review_status FROM emails ORDER BY received_at DESC LIMIT 1000",
    ).all<Record<string, unknown>>(),
    db.prepare(
      "SELECT id, created_at, module, actor, risk_level, action_taken, pii_detected, ai_used, hash FROM audit_events ORDER BY created_at DESC LIMIT 500",
    ).all<Record<string, unknown>>(),
    new AuditRepository(db).verifyChain().catch(() => ({ chain_ok: false })),
  ]);

  const emails: DashboardEmailRow[] = (emailRes.results ?? []).map((r) => ({
    id: String(r.id),
    fromAddress: String(r.from_address),
    fromName: r.from_name === null ? null : String(r.from_name),
    subject: String(r.subject),
    receivedAt: String(r.received_at),
    folder: r.folder as Folder,
    riskLevel: (r.risk_level ?? null) as RiskLevel | null,
    riskScore: typeof r.risk_score === "number" ? r.risk_score : null,
    indicators: parseArray(r.indicators),
    reviewStatus: String(r.review_status),
  }));

  const audit: DashboardAuditRow[] = (auditRes.results ?? []).map((r) => ({
    id: String(r.id),
    createdAt: String(r.created_at),
    module: String(r.module),
    actor: String(r.actor),
    riskLevel: (r.risk_level ?? null) as RiskLevel | null,
    actionTaken: String(r.action_taken),
    piiDetected: parseArray(r.pii_detected).map(String),
    aiUsed: r.ai_used === 1 || r.ai_used === true,
    hash: String(r.hash),
  }));

  return { emails, audit, chainOk: chain.chain_ok };
}
