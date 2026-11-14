// PR G4 · Panel principal: contrato completo (PLAN_UX.md §4) calculado desde filas de D1.
import { describe, expect, it } from "vitest";
import { buildDashboard, inferEntity, type DashboardAuditRow, type DashboardEmailRow } from "../src/application/dashboard";

const now = new Date("2026-11-14T10:30:00Z");
const email = (o: Partial<DashboardEmailRow>): DashboardEmailRow => ({
  id: "e", fromAddress: "x@banco-demo.com.ve", fromName: null, subject: "s", receivedAt: "2026-11-14T10:00:00Z",
  folder: "INBOX", riskLevel: "SAFE", riskScore: 5, indicators: [], reviewStatus: "N/A", ...o,
});
const audit = (o: Partial<DashboardAuditRow>): DashboardAuditRow => ({
  id: "a", createdAt: "2026-11-14T10:28:00Z", module: "MAIL_ANALYZER", actor: "SYSTEM", riskLevel: null,
  actionTaken: "INBOX", piiDetected: [], aiUsed: true, hash: "h", ...o,
});

const emails = [
  email({ id: "1", fromName: "SUDEBAN - Supervisión", fromAddress: "n@sudeban-gob.com", folder: "QUARANTINE", riskLevel: "CRITICAL", riskScore: 97, reviewStatus: "PENDING",
    indicators: [{ category: "REMITENTE" }, { category: "AUTENTICACION" }, { category: "ADJUNTOS" }] }),
  email({ id: "2", fromName: "Presidencia", fromAddress: "p@banco-demo-corp.net", folder: "QUARANTINE", riskLevel: "CRITICAL", riskScore: 92, reviewStatus: "PENDING",
    indicators: [{ category: "INGENIERIA_SOCIAL" }] }),
  email({ id: "3", fromAddress: "t@bancodemo-alerta.org", folder: "SPAM", riskLevel: "HIGH", riskScore: 68, indicators: [{ category: "ENLACES" }] }),
  email({ id: "4", folder: "INBOX", riskLevel: "LOW", riskScore: 32 }),
  email({ id: "5", folder: "INBOX", riskLevel: "SAFE", riskScore: 6, receivedAt: "2026-11-14T08:15:00Z" }),
];

describe("buildDashboard (G4)", () => {
  const d = buildDashboard({ emails, audit: [audit({ id: "x" }), audit({ id: "y", module: "ASSISTANT_GUARD", actionTaken: "BLOCKED", piiDetected: ["CEDULA"] })], chainOk: true, now });

  it("trae todos los bloques del contrato", () => {
    for (const k of ["generated_at", "kpis", "by_risk_level", "by_folder", "by_indicator_category", "top_impersonated", "timeline", "review_queue", "recent_events", "chain_ok", "ai_status"]) {
      expect(d).toHaveProperty(k);
    }
  });

  it("KPI correctos", () => {
    expect(d.kpis).toMatchObject({ emails_analyzed: 5, quarantined: 2, sent_to_spam: 1, pending_review: 2, threats_blocked_pct: 60, avg_risk_score: 59, pii_protected: 1, blocked_assistant_requests: 1 });
  });

  it("conteos por nivel, carpeta y categoría", () => {
    expect(d.by_risk_level).toEqual({ SAFE: 1, LOW: 1, HIGH: 1, CRITICAL: 2 });
    expect(d.by_folder).toEqual({ INBOX: 2, SPAM: 1, QUARANTINE: 2 });
    expect(d.by_indicator_category).toMatchObject({ REMITENTE: 1, AUTENTICACION: 1, ADJUNTOS: 1, INGENIERIA_SOCIAL: 1, ENLACES: 1 });
  });

  it("cola de revisión ordenada por riesgo y entidades suplantadas", () => {
    expect(d.review_queue.map((r) => r.email_id)).toEqual(["1", "2"]);
    // Como en el prototipo: el fraude del CEO dentro del banco cuenta como suplantación de BANCO_DEMO.
    expect(d.top_impersonated).toEqual([{ entity: "BANCO_DEMO", count: 2 }, { entity: "SUDEBAN", count: 1 }]);
  });

  it("línea de tiempo de 12 horas y estado de IA", () => {
    expect(d.timeline).toHaveLength(12);
    expect(d.timeline.at(-1)).toMatchObject({ total: 4, threats: 3 });
    expect(d.ai_status).toBe("ONLINE");
    expect(d.chain_ok).toBe(true);
  });

  it("sin datos: todo en cero y sin errores", () => {
    const e = buildDashboard({ emails: [], audit: [], chainOk: true, now });
    expect(e.kpis.emails_analyzed).toBe(0);
    expect(e.kpis.threats_blocked_pct).toBe(0);
    expect(e.ai_status).toBe("UNKNOWN");
  });

  it("modo reglas cuando la IA no respondió en los últimos 5 min", () => {
    expect(buildDashboard({ emails: [], audit: [audit({ aiUsed: false })], chainOk: true, now }).ai_status).toBe("FALLBACK");
  });
});

describe("inferEntity", () => {
  it.each([
    ["SUDEBAN - Supervisión", "a@x.com", "SUDEBAN"],
    [null, "cobranzas@servicios-integrales-ve.info", "PROVEEDOR"],
    ["Portal Tributario", "notifica@seniat-tramites.com", "SENIAT"],
    [null, "alerta@otro.com", "OTRA"],
  ])("%s <%s> → %s", (name, addr, ent) => expect(inferEntity(name, addr)).toBe(ent));
});
