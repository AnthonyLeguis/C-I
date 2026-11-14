// Dueño: Gabriel (PR G3). Buzón institucional con datos reales de D1 (C&I.md §5.2, PLAN_UX §5.3).
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import type { AiOrigin, Indicator } from "../domain/types";
import { effectiveAi } from "../infrastructure/systemSettings";
import { DEMO_SCENARIOS, findScenario } from "../application/demoScenarios";
import { analyzeEmail } from "../application/analyzeEmail";
import type { MailAnalyzer } from "../application/interimAnalyzer";
import { approveEmail, escalateEmail } from "../application/actions";
import { attachAiOrigin, deliverEmail, listMailbox, reviewEmail, type MailboxEmail, type MailboxStorePort } from "../application/mailbox";
import { domainStoreFor } from "../infrastructure/domainStore";
import { getCurrentUser, requireRole } from "../infrastructure/auth";
import { AuditRepository, aiOriginByEmail, emailRepository } from "../infrastructure/d1Repos";
import { parseEmail } from "../infrastructure/emailParser";
import { sanitizePii } from "../infrastructure/piiSanitizer";
import { WorkersAiGateway } from "../infrastructure/workersAiGateway";

const View = z.enum(["ALL", "PENDING", "INBOX", "SPAM", "QUARANTINE"]).default("ALL");
const DeliverRequest = z.object({ case_id: z.string().min(1) });
const ReviewRequest = z.object({ decision: z.enum(["CONFIRM", "RESTORE"]) });

export function storeFor(db: D1Database): MailboxStorePort {
  return {
    findByFolder: (f) => emailRepository.findByFolder(db, f),
    findById: (id) => emailRepository.findById(db, id),
    insert: (e) => emailRepository.insert(db, { ...e, fromName: e.fromName ?? undefined, replyTo: e.replyTo ?? undefined }),
    updateFolder: (id, f, r) => emailRepository.updateFolder(db, id, f, r),
  };
}

/** Pasa el correo al formato del contrato (snake_case). */
const toDto = (e: MailboxEmail & Partial<AiOrigin>) => ({
  id: e.id, recipient: e.recipient, from_address: e.fromAddress, from_name: e.fromName, reply_to: e.replyTo, subject: e.subject,
  body_sanitized: e.bodySanitized, received_at: e.receivedAt, folder: e.folder, risk_level: e.riskLevel, risk_score: e.riskScore,
  indicators: e.indicators, legal_basis: e.legalBasis, xai_explanation: e.xaiExplanation, review_status: e.reviewStatus,
  ai_used: e.aiUsed ?? false, ai_model: e.aiModel ?? null, // origen de la explicación (transparencia de la IA)
});


/** Adapta el analizador W4 (caso de uso) al puerto `MailAnalyzer` que usa G3. */
export function w4Analyzer(ai: Ai | undefined): MailAnalyzer {
  return async (email) => {
    const parsed = parseEmail({
      from_address: email.fromAddress,
      from_name: email.fromName,
      reply_to: email.replyTo,
      subject: email.subject,
      body: email.body,
      auth_results: email.authResults,
      attachments: email.attachments,
    });
    // El contrato público de /mail/analyze no expone el peso de cada señal; el Buzón sí lo necesita para el
    // modal de hallazgos, así que se toma del puerto de persistencia (recibe los indicadores completos).
    let scored: Indicator[] = [];
    const result = await analyzeEmail(parsed, { ai: new WorkersAiGateway(ai), persistEmail: { save: async (e) => { scored = e.indicators; } } });
    return {
      riskLevel: result.risk_level,
      riskScore: result.risk_score,
      folder: result.action_taken,
      indicators: scored.length > 0 ? scored : result.indicators.map((indicator) => ({ ...indicator, weight: 0 })),
      detectedUrls: result.detected_urls,
      legalBasis: result.legal_basis,
      xaiExplanation: result.xai_explanation,
      recommendation: result.recommendation,
      piiMasked: result.pii_masked,
      aiUsed: result.ai_used,
      aiModel: result.ai_model,
      humanReviewRequired: result.human_review_required,
    };
  };
}

export const mailboxRoutes = new Hono<AppEnv>();

mailboxRoutes.get("/", requireRole("ANALYST") as never, async (c) => {
  const view = View.safeParse(c.req.query("folder") ?? undefined);
  if (!view.success) return c.json({ error: "Carpeta inválida." }, 400);
  const r = await listMailbox(view.data, storeFor(c.env.DB));
  const origins = await aiOriginByEmail(c.env.DB, r.emails.map((e) => e.id));
  return c.json({ ...r, emails: attachAiOrigin(r.emails, origins).map(toDto) });
});

mailboxRoutes.get("/scenarios", requireRole("ANALYST") as never, (c) =>
  c.json({ scenarios: DEMO_SCENARIOS.map((s) => ({ id: s.id, label: s.label })) }),
);

mailboxRoutes.post("/deliver", requireRole("ANALYST") as never, async (c) => {
  const parsed = DeliverRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Indique el escenario (case_id)." }, 400);
  const scenario = findScenario(parsed.data.case_id);
  if (!scenario) return c.json({ error: "Escenario no encontrado." }, 404);
  const result = await deliverEmail(scenario.email, {
    store: storeFor(c.env.DB), audit: new AuditRepository(c.env.DB),
    analyze: w4Analyzer(await effectiveAi(c.env)),
    sanitize: (t) => sanitizePii(t).sanitized, newId: () => crypto.randomUUID(), now: () => new Date(),
    isBlocked: (d) => domainStoreFor(c.env.DB).isBlocked(d),
  });
  return c.json(result, 201);
});

mailboxRoutes.post("/:id/review", requireRole("SUPERVISOR") as never, async (c) => {
  const parsed = ReviewRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Decisión inválida: use CONFIRM o RESTORE." }, 400);
  const user = await getCurrentUser(c as never);
  const r = await reviewEmail(c.req.param("id"), parsed.data.decision, user?.display_name ?? "desconocido", { store: storeFor(c.env.DB), audit: new AuditRepository(c.env.DB) });
  if (!r) return c.json({ error: "Correo no encontrado." }, 404);
  return c.json(r);
});

// G7 · Acciones en 1 clic (prototipo): Marcar seguro y Escalar a CISO.
for (const [action, fn] of [["approve", approveEmail], ["escalate", escalateEmail]] as const) {
  mailboxRoutes.post(`/:id/${action}`, requireRole("ANALYST") as never, async (c) => {
    const user = await getCurrentUser(c as never);
    const r = await fn(c.req.param("id"), user?.display_name ?? "desconocido", { store: storeFor(c.env.DB), audit: new AuditRepository(c.env.DB) });
    if (!r) return c.json({ error: "Correo no encontrado." }, 404);
    return c.json(r);
  });
}
