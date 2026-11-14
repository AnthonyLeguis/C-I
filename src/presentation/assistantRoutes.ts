// Dueño: Anthony (PR A3). F0: MOCK.
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { MOCK_ASSISTANT_BLOCKED } from "./mocks";

const AskRequest = z.object({ question: z.string().min(1).max(4000), email_id: z.string().nullable().optional() });

export const assistantRoutes = new Hono<AppEnv>();

assistantRoutes.post("/ask", async (c) => {
  const parsed = AskRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Pregunta inválida." }, 400);
  return c.json(MOCK_ASSISTANT_BLOCKED);
});
