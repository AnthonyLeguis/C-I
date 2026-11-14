// Dueño: Gabriel (PR G7). Lista corporativa de dominios bloqueados (CISO y Master).
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { blockDomain, unblockDomain } from "../application/actions";
import { getCurrentUser, requireRole } from "../infrastructure/auth";
import { AuditRepository } from "../infrastructure/d1Repos";
import { domainStoreFor } from "../infrastructure/domainStore";

const BlockRequest = z.object({ domain: z.string().min(3).max(253), reason: z.string().max(300).optional(), email_id: z.string().optional() });

export const domainRoutes = new Hono<AppEnv>();

domainRoutes.get("/blocked", requireRole("ANALYST") as never, async (c) => c.json({ domains: await domainStoreFor(c.env.DB).list() }));

domainRoutes.post("/block", requireRole("SUPERVISOR") as never, async (c) => {
  const parsed = BlockRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Indique el dominio a bloquear." }, 400);
  const user = await getCurrentUser(c as never);
  const r = await blockDomain(parsed.data.domain, parsed.data.reason ?? "Bloqueado desde el análisis de un correo", user?.display_name ?? "desconocido", parsed.data.email_id ?? null,
    { audit: new AuditRepository(c.env.DB), domains: domainStoreFor(c.env.DB) });
  if (!r.ok) return c.json({ error: r.error }, r.conflict ? 409 : 400);
  return c.json({ domain: r.domain, audit_hash: r.audit_hash }, 201);
});

domainRoutes.delete("/blocked/:domain", requireRole("SUPERVISOR") as never, async (c) => {
  const user = await getCurrentUser(c as never);
  const r = await unblockDomain(c.req.param("domain"), user?.display_name ?? "desconocido",
    { audit: new AuditRepository(c.env.DB), domains: domainStoreFor(c.env.DB) });
  if (!r) return c.json({ error: "El dominio no estaba bloqueado." }, 404);
  return c.json(r);
});
