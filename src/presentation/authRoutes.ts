// Dueño: Gabriel (PR G1). F0: MOCK sin autenticación real.
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { MOCK_USER } from "./mocks";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/login", (c) => c.json({ user: MOCK_USER }));
authRoutes.post("/logout", (c) => c.json({ ok: true }));
authRoutes.get("/me", (c) => c.json({ user: MOCK_USER }));
