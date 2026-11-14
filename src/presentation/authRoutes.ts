// Dueño: Gabriel (PR G1). Autenticación real con PBKDF2 y cookies HMAC (C&I.md §5.2).
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import {
  authenticateUser,
  clearSessionCookie,
  getCurrentUser,
  SESSION_MAX_AGE_SECONDS,
  setSessionCookie,
  signSession,
} from "../infrastructure/auth";

export const LoginRequest = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = LoginRequest.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Credenciales requeridas: ingrese usuario y contraseña." },
      400
    );
  }

  const { username, password } = parsed.data;
  const user = await authenticateUser(c, username, password);
  if (!user) {
    return c.json({ error: "Usuario o contraseña inválidos." }, 401);
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const secretKey = c.env?.SESSION_SECRET || "dev-session-key";
  const token = await signSession({ user, exp }, secretKey);
  setSessionCookie(c, token);

  return c.json({ user });
});

authRoutes.post("/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: "No autenticado." }, 401);
  }
  return c.json({ user });
});
