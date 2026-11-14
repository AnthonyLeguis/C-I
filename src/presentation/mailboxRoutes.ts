// Dueño: Gabriel (PR G3). Buzón institucional con datos reales de D1 (C&I.md §5.2, PLAN_UX §5.3).
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { DEMO_SCENARIOS, findScenario } from "../application/demoScenarios";
import { rulesOnlyAnalyzer } from "../application/interimAnalyzer";
import { deliverEmail, listMailbox, reviewEmail, type MailboxEmail, type MailboxStorePort } from "../application/mailbox";
import { getCurrentUser, requireRole } from "../infrastructure/auth";
import { AuditRepository, emailRepository } from "../infrastructure/d1Repos";
import { sanitizePii } from "../infrastructure/piiSanitizer";

const View = z.enum(["ALL", "PENDING", "INBOX", "SPAM", "QUARANTINE"]).default("ALL");
const DeliverRequest = z.object({ case_id: z.string().min(1) });
const ReviewRequest = z.object({ decision: z.enum(["CONFIRM", "RESTORE"]) });

function storeFor(db: D1Database): MailboxStorePort {
  return {
    findByFolder: (f) => emailRepository.findByFolder(db, f),
    findById: (id) => emailRepository.findById(db, id),
    insert: (e) => emailRepository.insert(db, { ...e, fromName: e.fromName ?? undefined, replyTo: e.replyTo ?? undefined }),
    updateFolder: (id, f, r) => emailRepository.updateFolder(db, id, f, r),
  };
}

/** Pasa el correo al formato del contrato (snake_case). */
const toDto = (e: MailboxEmail) => ({
  id: e.id, recipient: e.recipient, from_address: e.fromAddress, from_name: e.fromName, reply_to: e.replyTo, subject: e.subject,
  body_sanitized: e.bodySanitized, received_at: e.receivedAt, folder: e.folder, risk_level: e.riskLevel, risk_score: e.riskScore,
  indicators: e.indicators, legal_basis: e.legalBasis, xai_explanation: e.xaiExplanation, review_status: e.reviewStatus,
});

export const mailboxRoutes = new Hono<AppEnv>();

mailboxRoutes.get("/", requireRole("ANALYST") as never, async (c) => {
  const view = View.safeParse(c.req.query("folder") ?? undefined);
  if (!view.success) return c.json({ error: "Carpeta inválida." }, 400);
  const r = await listMailbox(view.data, storeFor(c.env.DB));
  return c.json({ ...r, emails: r.emails.map(toDto) });
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
    analyze: rulesOnlyAnalyzer, // ⚠️ Cambiar por analyzeEmail de W4 cuando entre
    sanitize: (t) => sanitizePii(t).sanitized, newId: () => crypto.randomUUID(), now: () => new Date(),
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
