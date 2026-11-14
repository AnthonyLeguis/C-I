// Dueño: Gabriel (PR G2). F0: MOCK.
import { Hono } from "hono";
import type { AppEnv } from "../env";

export const auditRoutes = new Hono<AppEnv>();

auditRoutes.get("/verify", (c) => c.json({ chain_ok: true, records: 0, broken_at: null }));
