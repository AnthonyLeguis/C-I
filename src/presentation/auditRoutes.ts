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

/** G6 · GET /audit/events — bitácora para la pantalla (todos los perfiles: lectura; exportar y verificar siguen restringidos). Filtros: module, level, q; límite 200. */
const EVENT_COLUMNS = "id, created_at, module, actor, risk_level, risk_score, action_taken, email_id, xai_explanation, ai_used, ai_model, prev_hash, hash";
auditRoutes.get("/events", requireRole("ANALYST") as never, async (c) => {
  const module = c.req.query("module");
  const level = c.req.query("level");
  const q = (c.req.query("q") ?? "").trim().toLowerCase();
  const where: string[] = [];
  const binds: unknown[] = [];
  if (module && /^[A-Z_]+$/.test(module)) { where.push("module = ?"); binds.push(module); }
  if (level && /^(SAFE|LOW|HIGH|CRITICAL)$/.test(level)) { where.push("risk_level = ?"); binds.push(level); }
  if (q) { where.push("(lower(actor) LIKE ? OR lower(action_taken) LIKE ? OR lower(coalesce(xai_explanation,'')) LIKE ? OR hash LIKE ?)"); binds.push(`%${q}%`, `%${q}%`, `%${q}%`, `${q}%`); }
  const sql = `SELECT ${EVENT_COLUMNS} FROM audit_events ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT 200`;
  const r = await c.env.DB.prepare(sql).bind(...binds).all<Record<string, unknown>>();
  const total = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM audit_events").first<{ n: number }>();
  c.header("cache-control", "no-store");
  return c.json({ total: total?.n ?? 0, events: (r.results ?? []).map((e) => ({ ...e, ai_used: e.ai_used === 1 })) });
});
