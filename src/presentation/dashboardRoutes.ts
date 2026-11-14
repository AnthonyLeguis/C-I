// Dueño: Gabriel (PR G4). Panel principal con datos reales de D1 (PLAN_UX.md §4). Requiere sesión (ANALYST+).
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { buildDashboard } from "../application/dashboard";
import { requireRole } from "../infrastructure/auth";
import { loadDashboardData } from "../infrastructure/dashboardQueries";
import { getAiMode } from "../infrastructure/systemSettings";

export const dashboardRoutes = new Hono<AppEnv>();

dashboardRoutes.get("/", requireRole("ANALYST") as never, async (c) => {
  const data = await loadDashboardData(c.env.DB);
  c.header("cache-control", "no-store");
  const d = buildDashboard({ ...data, now: new Date() });
  // A6: en modo reglas el estado de IA es siempre FALLBACK.
  return c.json((await getAiMode(c.env.DB)) === "RULES" ? { ...d, ai_status: "FALLBACK" } : d);
});
