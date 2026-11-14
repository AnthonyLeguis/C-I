// Dueño: Anthony (PR A6). Consola de Soporte: solo Master / Soporte Técnico (ADMIN). C&I.md §5.2.
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { getSupportStatus, resetDemo, setOperationMode } from "../application/support";
import { getCurrentUser, requireRole } from "../infrastructure/auth";
import { AuditRepository } from "../infrastructure/d1Repos";
import { supportStoreFor } from "../infrastructure/supportStore";
import { AI_MODELS } from "../infrastructure/workersAiGateway";

const ModeRequest = z.object({ mode: z.enum(["ONLINE", "RULES_ONLY"]) });

export const supportRoutes = new Hono<AppEnv>();

supportRoutes.get("/status", requireRole("ADMIN") as never, async (c) =>
  c.json(await getSupportStatus(supportStoreFor(c.env.DB), c.get("aiBound") ?? c.env.AI !== undefined, AI_MODELS.chat)));

supportRoutes.post("/mode", requireRole("ADMIN") as never, async (c) => {
  const parsed = ModeRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Modo inválido: use ONLINE o RULES_ONLY." }, 400);
  const user = await getCurrentUser(c as never);
  const r = await setOperationMode(parsed.data.mode, user?.display_name ?? "desconocido",
    { store: supportStoreFor(c.env.DB), audit: new AuditRepository(c.env.DB) });
  return c.json(r);
});

supportRoutes.post("/reset-demo", requireRole("ADMIN") as never, async (c) => {
  const user = await getCurrentUser(c as never);
  const r = await resetDemo(user?.display_name ?? "desconocido", { store: supportStoreFor(c.env.DB), audit: new AuditRepository(c.env.DB) });
  return c.json(r);
});
