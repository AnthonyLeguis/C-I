// Dueño: Williams (PR W4). Analizador real: parser (W2) → reglas (W3) → IA (A2) → D1 (G2).
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { effectiveAi } from "../infrastructure/systemSettings";
import { analyzeEmail } from "../application/analyzeEmail";
import type { EmailPersistencePort } from "../application/analyzeEmail";
import { getCurrentUser, requireRole } from "../infrastructure/auth";
import { AuditRepository, emailRepository } from "../infrastructure/d1Repos";
import { EmailParseError } from "../infrastructure/emailParser";
import { parseEmail } from "../infrastructure/emailParser";
import type { ParsedEmail } from "../infrastructure/emailParser";
import { WorkersAiGateway } from "../infrastructure/workersAiGateway";

// Límites de tamaño: un correo real cabe de sobra y se evita el abuso de CPU (expresiones regulares) y de IA.
export const AnalyzeRequest = z.object({
  from_address: z.string().min(3).max(320),
  from_name: z.string().max(200).optional(),
  reply_to: z.string().max(320).optional(),
  subject: z.string().max(500),
  body: z.string().max(20_000),
  auth_results: z.string().max(2_000).optional(),
  attachments: z.array(z.string().max(255)).max(25).default([]),
});

export const mailRoutes = new Hono<AppEnv>();

mailRoutes.post("/analyze", requireRole("ANALYST") as never, async (c) => {
  const parsed = AnalyzeRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Correo inválido: revise remitente, asunto y cuerpo." }, 400);
  }

  let email: ParsedEmail;
  try {
    email = parseEmail(parsed.data);
  } catch (error) {
    if (error instanceof EmailParseError) {
      return c.json({ error: "Correo inválido: revise remitente, asunto y cuerpo." }, 400);
    }
    throw error;
  }

  const db = c.env.DB;
  // ?persist=false: analizar sin guardar el correo en el buzón (lo usa la prueba de humo de producción).
  const persist = c.req.query("persist") !== "false";
  let persistEmail: EmailPersistencePort | undefined;
  if (db !== undefined && persist) {
    persistEmail = {
      save: async (record) => {
        await emailRepository.insert(db, record);
      },
    };
  }

  const user = await getCurrentUser(c);
  const result = await analyzeEmail(email, {
    ai: new WorkersAiGateway(await effectiveAi(c.env)),
    audit: db === undefined ? undefined : new AuditRepository(db),
    persistEmail,
    actor: user?.username ?? "SYSTEM",
  });

  return c.json(result);
});
