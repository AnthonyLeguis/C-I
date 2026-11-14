// Dueño: Anthony (PR A6). Consola de Soporte — la ven todos los perfiles; solo el Master (ADMIN) actúa.
// Estado del sistema, modo del motor de IA (en línea / solo reglas) y restablecimiento de la demo.
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { DEMO_SCENARIOS } from "../application/demoScenarios";
import { deliverEmail } from "../application/mailbox";
import { getCurrentUser, requireRole } from "../infrastructure/auth";
import { AuditRepository } from "../infrastructure/d1Repos";
import { domainStoreFor } from "../infrastructure/domainStore";
import { sanitizePii } from "../infrastructure/piiSanitizer";
import { getAiMode, setAiMode, effectiveAi } from "../infrastructure/systemSettings";
import { AI_MODELS } from "../infrastructure/workersAiGateway";
import { storeFor, w4Analyzer } from "./mailboxRoutes";

const ModeRequest = z.object({ mode: z.enum(["ONLINE", "RULES"]) });
const ResetRequest = z.object({ with_samples: z.boolean().default(true) });

export const supportRoutes = new Hono<AppEnv>();
supportRoutes.use("*", requireRole("ANALYST") as never); // lectura del estado: todos los perfiles
supportRoutes.use("/mode", requireRole("ADMIN") as never); // acciones: solo Master
supportRoutes.use("/reset-demo", requireRole("ADMIN") as never);

supportRoutes.get("/status", async (c) => {
  const db = c.env.DB;
  const t0 = Date.now();
  const counts = await db.prepare(
    "SELECT (SELECT COUNT(*) FROM emails) AS emails, (SELECT COUNT(*) FROM audit_events) AS events, (SELECT COUNT(*) FROM blocked_domains) AS blocked",
  ).first<{ emails: number; events: number; blocked: number }>();
  const dbLatency = Date.now() - t0;
  const mode = await getAiMode(db);
  return c.json({
    ai: { mode, binding: c.env.AI !== undefined, model: AI_MODELS.chat, fallback_model: AI_MODELS.chatFallback, guard_model: AI_MODELS.guard },
    database: { ok: true, latency_ms: dbLatency, ...counts },
    mail_ingestion: { source: "Buzón institucional de demostración (simulador)", ok: true },
    checked_at: new Date().toISOString(),
  });
});

supportRoutes.post("/mode", async (c) => {
  const parsed = ModeRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Modo inválido: use ONLINE o RULES." }, 400);
  const user = await getCurrentUser(c as never);
  const actor = user?.display_name ?? "desconocido";
  await setAiMode(c.env.DB, parsed.data.mode, actor);
  const { hash } = await new AuditRepository(c.env.DB).append({
    module: "REVIEW", emailId: null, actor, riskLevel: null, riskScore: null, actionTaken: parsed.data.mode === "RULES" ? "AI_MODE_RULES" : "AI_MODE_ONLINE",
    indicators: [], legalBasis: [], piiDetected: [], xaiExplanation: `Modo del motor de IA: ${parsed.data.mode}`, aiUsed: false, aiModel: null,
  });
  return c.json({ mode: parsed.data.mode, audit_hash: hash });
});

supportRoutes.post("/reset-demo", async (c) => {
  const parsed = ResetRequest.safeParse(await c.req.json().catch(() => ({})));
  const withSamples = parsed.success ? parsed.data.with_samples : true;
  const db = c.env.DB;
  const user = await getCurrentUser(c as never);
  const actor = user?.display_name ?? "desconocido";
  await db.batch([db.prepare("DELETE FROM emails"), db.prepare("DELETE FROM audit_events"), db.prepare("DELETE FROM blocked_domains")]);
  const audit = new AuditRepository(db);
  await audit.append({
    module: "REVIEW", emailId: null, actor, riskLevel: null, riskScore: null, actionTaken: "DEMO_RESET",
    indicators: [], legalBasis: [], piiDetected: [], xaiExplanation: "Entorno de demostración restablecido", aiUsed: false, aiModel: null,
  });
  let loaded = 0;
  if (withSamples) {
    const ai = await effectiveAi(c.env);
    for (const s of DEMO_SCENARIOS) {
      await deliverEmail(s.email, {
        store: storeFor(db), audit, analyze: w4Analyzer(ai), sanitize: (t) => sanitizePii(t).sanitized,
        newId: () => crypto.randomUUID(), now: () => new Date(), isBlocked: (d) => domainStoreFor(db).isBlocked(d),
      });
      loaded++;
    }
  }
  return c.json({ ok: true, loaded });
});
