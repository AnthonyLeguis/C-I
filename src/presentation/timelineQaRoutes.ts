// MÓDULO ELIMINABLE "timeline-qa" (Anthony). Devuelve el avance del equipo calculado por el workflow
// .github/workflows/timeline-qa.yml, que se ejecuta con cada actualización de `development`.
import { Hono } from "hono";
import type { AppEnv } from "../env";

export const timelineQaRoutes = new Hono<AppEnv>();

timelineQaRoutes.get("/", async (c) => {
  try {
    const row = await c.env.DB.prepare("SELECT payload, updated_at FROM timeline_qa WHERE id = 1").first<{ payload: string; updated_at: string }>();
    if (!row) return c.json({ error: "Aún no hay datos: se generan cuando development recibe un PR aprobado por QA." }, 404);
    c.header("cache-control", "no-store");
    return c.json({ ...(JSON.parse(row.payload) as Record<string, unknown>), stored_at: row.updated_at });
  } catch {
    return c.json({ error: "El módulo timeline-qa no está inicializado (falta la migración 0010)." }, 503);
  }
});
