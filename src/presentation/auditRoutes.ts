// [CAPA 4 — PRESENTACIÓN] Rutas de auditoría (PR G2 · Gabriel).
// C&I.md §5.2: GET /api/v1/audit/verify — solo ADMIN, verifica la cadena de hash SHA-256.

import { Hono } from "hono";
import type { AppEnv } from "../env";
import { requireRole } from "../infrastructure/auth";
import { AuditRepository } from "../infrastructure/d1Repos";
import { toCsv } from "../application/actions";

export const auditRoutes = new Hono<AppEnv>();

/**
 * GET /audit/verify
 * Requiere rol ADMIN.
 * Recorre todos los registros de audit_events y recomputa cada hash.
 * Responde: { chain_ok, total, broken_at }
 */
auditRoutes.get(
  "/verify",
  requireRole("ADMIN") as never,
  async (c) => {
    const db = c.env.DB;
    const repo = new AuditRepository(db);
    const result = await repo.verifyChain();
    return c.json(result);
  }
);

/** G7 · GET /audit/export.csv — bitácora completa en CSV (CISO y Master). */
const CSV_COLUMNS = ["created_at", "module", "actor", "risk_level", "risk_score", "action_taken", "email_id", "indicators", "pii_detected", "ai_used", "ai_model", "prev_hash", "hash"];
auditRoutes.get("/export.csv", requireRole("SUPERVISOR") as never, async (c) => {
  const r = await c.env.DB.prepare(`SELECT ${CSV_COLUMNS.join(", ")} FROM audit_events ORDER BY created_at ASC`).all<Record<string, unknown>>();
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(r.results ?? [], CSV_COLUMNS), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="bitacora-ci-${stamp}.csv"`, "cache-control": "no-store" },
  });
});
