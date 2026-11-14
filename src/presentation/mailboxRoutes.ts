// Dueño: Gabriel (PR G3). F0: MOCK.
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { MOCK_ANALYZE_CRITICAL, MOCK_MAILBOX } from "./mocks";

const FolderQuery = z.enum(["INBOX", "SPAM", "QUARANTINE"]).default("INBOX");
const ReviewRequest = z.object({ decision: z.enum(["CONFIRM", "RESTORE"]) });

export const mailboxRoutes = new Hono<AppEnv>();

mailboxRoutes.get("/", (c) => {
  const folder = FolderQuery.safeParse(c.req.query("folder") ?? undefined);
  if (!folder.success) return c.json({ error: "Carpeta inválida." }, 400);
  return c.json({ ...MOCK_MAILBOX, folder: folder.data });
});

mailboxRoutes.post("/deliver", (c) => c.json({ email_id: MOCK_MAILBOX.emails[0]?.id, verdict: MOCK_ANALYZE_CRITICAL }));

mailboxRoutes.post("/:id/review", async (c) => {
  const parsed = ReviewRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Decisión inválida." }, 400);
  return c.json({
    email_id: c.req.param("id"),
    review_status: parsed.data.decision === "CONFIRM" ? "CONFIRMED" : "RESTORED",
    folder: parsed.data.decision === "CONFIRM" ? "QUARANTINE" : "INBOX",
    audit_hash: "a3f9c2d1e8b7…",
  });
});
