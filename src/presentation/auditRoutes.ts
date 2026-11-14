// [CAPA 4 — PRESENTACIÓN] Rutas de auditoría (PR G2 · Gabriel).
// C&I.md §5.2: GET /api/v1/audit/verify — solo ADMIN, verifica la cadena de hash SHA-256.

import { Hono } from "hono";
import type { AppEnv } from "../env";
import { requireRole } from "../infrastructure/auth";
import { AuditRepository } from "../infrastructure/d1Repos";

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
