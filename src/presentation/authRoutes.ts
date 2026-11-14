// Dueño: Gabriel (PR G1). Autenticación real con PBKDF2 y cookies HMAC (C&I.md §5.2).
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import {
  authenticateUser,
  clearSessionCookie,
  getCurrentUser,
  getSessionSecret,
  DEMO_USERS,
  SESSION_MAX_AGE_SECONDS,
  setSessionCookie,
  signSession,
  quickLoginUser,
} from "../infrastructure/auth";

export const LoginRequest = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const QuickLoginRequest = z.object({
  username: z.string().min(1, "El usuario es requerido"),
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

  let secretKey: string;
  try {
    secretKey = getSessionSecret(c);
  } catch {
    return c.json({ error: "Error de configuración del servidor." }, 500);
  }

  const { username, password } = parsed.data;
  const user = await authenticateUser(c, username, password);
  if (!user) {
    return c.json({ error: "Usuario o contraseña inválidos." }, 401);
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const token = await signSession({ user, exp }, secretKey);
  setSessionCookie(c, token);

  return c.json({ user });
});

/** POST /auth/quick-login — solo para los 3 usuarios del prototipo (jrios, svalenzuela, cmendoza).
 *  Recibe { "username": "jrios" } y emite la misma cookie de sesión sin contraseña.
 *  Solo disponible en el prototipo de demo. */
authRoutes.post("/quick-login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = QuickLoginRequest.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "El campo username es requerido." }, 400);
  }

  let secretKey: string;
  try {
    secretKey = getSessionSecret(c);
  } catch {
    return c.json({ error: "Error de configuración del servidor." }, 500);
  }

  const user = quickLoginUser(parsed.data.username);
  if (!user) {
    return c.json(
      {
        error: "Usuario no válido para quick-login. Use: jrios, svalenzuela o cmendoza.",
      },
      401
    );
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
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

// Exportar lista de usuarios demo para la UI de login (PLAN_UX §5.2)
authRoutes.get("/demo-users", (c) => {
  const users = Object.values(DEMO_USERS).map(({ user }) => ({
    username: user.username,
    display_name: user.display_name,
    role: user.role,
  }));
  return c.json({ users });
});
