// Dueño: Anthony (PR A3). Asistente real con guardián ético.
// Bitácora: cuando Gabriel entregue el repositorio D1 (G2), se conecta aquí en `audit`.
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { askAssistant } from "../application/assistant";
import { AI_MODELS, WorkersAiGateway } from "../infrastructure/workersAiGateway";

const AskRequest = z.object({
  question: z.string().trim().min(1).max(4000),
  email_id: z.string().nullable().optional(),
});

export const assistantRoutes = new Hono<AppEnv>();

assistantRoutes.post("/ask", async (c) => {
  const parsed = AskRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Escribe una pregunta (máximo 4000 caracteres)." }, 400);

  const result = await askAssistant(
    { question: parsed.data.question, actor: "demo" },
    { ai: new WorkersAiGateway(c.env.AI), guardModelName: AI_MODELS.guard },
  );
  return c.json(result);
});
