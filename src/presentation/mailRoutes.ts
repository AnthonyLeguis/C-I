// Dueño: Williams (PR W4). F0: MOCK. Valida la forma del request con zod (contrato C&I.md §5.2).
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { MOCK_ANALYZE_CRITICAL, MOCK_ANALYZE_SAFE } from "./mocks";

export const AnalyzeRequest = z.object({
  from_address: z.string().min(3),
  from_name: z.string().optional(),
  reply_to: z.string().optional(),
  subject: z.string(),
  body: z.string(),
  auth_results: z.string().optional(),
  attachments: z.array(z.string()).default([]),
});

export const mailRoutes = new Hono<AppEnv>();

mailRoutes.post("/analyze", async (c) => {
  const parsed = AnalyzeRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Correo inválido: revise remitente, asunto y cuerpo." }, 400);
  // Mock: los dominios .com.ve o .gob.ve se consideran seguros; el resto, crítico.
  const safe = /\.(com|gob)\.ve$/i.test(parsed.data.from_address.split("@")[1] ?? "");
  return c.json(safe ? MOCK_ANALYZE_SAFE : MOCK_ANALYZE_CRITICAL);
});
