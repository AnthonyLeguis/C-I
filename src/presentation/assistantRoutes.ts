// Dueño: Anthony (PR A3). Asistente real con guardián ético.
// Cada consulta queda en la bitácora (G2) sin el texto original; requiere sesión.
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { askAssistant } from "../application/assistant";
import { AI_MODELS, WorkersAiGateway } from "../infrastructure/workersAiGateway";
import { getCurrentUser, requireRole } from "../infrastructure/auth";
import { AuditRepository } from "../infrastructure/d1Repos";

const AskRequest = z.object({
  question: z.string().trim().min(1).max(4000),
  email_id: z.string().nullable().optional(),
});

export const assistantRoutes = new Hono<AppEnv>();

assistantRoutes.post("/ask", requireRole("ANALYST") as never, async (c) => {
  const parsed = AskRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Escribe una pregunta (máximo 4000 caracteres)." }, 400);

  const user = await getCurrentUser(c as never);
  const result = await askAssistant(
    { question: parsed.data.question, actor: user?.display_name ?? "desconocido" },
    { ai: new WorkersAiGateway(c.env.AI), audit: new AuditRepository(c.env.DB), guardModelName: AI_MODELS.guard },
  );
  return c.json(result);
});
