// [CAPA 3 — INFRAESTRUCTURA] Autenticación y control de roles (PR G1 · Gabriel).
// C&I.md §5.3: Sesión firmada con HMAC en cookie HttpOnly; Secure; SameSite=Strict (8 h) y requireRole.
// Incluido en la rama G2 como dependencia de compilación (G1 y G2 van al mismo CP1).

import type { Context, MiddlewareHandler } from "hono";
import type { Role } from "../domain/types";
import { hasRole } from "../domain/types";
import type { AppEnv } from "../env";
import { verifyPassword } from "./hash";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 horas

export interface SessionUser {
  id: string;
  username: string;
  display_name: string;
  role: Role;
}

export interface SessionPayload {
  user: SessionUser;
  exp: number;
}

export type AuthEnv = AppEnv & {
  Variables: {
    user: SessionUser;
  };
};

/** Usuarios del prototipo. Quick-login solo funciona con estos tres. */
export const DEMO_USERS: Record<
  string,
  { user: SessionUser; salt: string; hash: string }
> = {
  jrios: {
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      username: "jrios",
      display_name: "Javier Ríos",
      role: "ANALYST",
    },
    salt: "10000000000000000000000000000001",
    hash: "3fa4df95912cae1839c96d08447862761e2b64522735ecf83f6b9cd55852a92f",
  },
  svalenzuela: {
    user: {
      id: "00000000-0000-4000-8000-000000000002",
      username: "svalenzuela",
      display_name: "Dra. Sofía Valenzuela",
      role: "SUPERVISOR",
    },
    salt: "10000000000000000000000000000002",
    hash: "9da21c41ecd136547ebdd93f3e547163524a8a9c722a7a3186466dbf9e0a4ca7",
  },
  cmendoza: {
    user: {
      id: "00000000-0000-4000-8000-000000000003",
      username: "cmendoza",
      display_name: "Carlos Mendoza",
      role: "ADMIN",
    },
    salt: "10000000000000000000000000000003",
    hash: "a7cadf824fcdc278470aaead86b55188b4ac1109c817048f6053228f0bfb50fb",
  },
};

// ---------------------------------------------------------------------------
// Helpers de HMAC
// ---------------------------------------------------------------------------

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(b64: string): ArrayBuffer {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const str = atob(pad ? padded + "=".repeat(4 - pad) : padded);
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
  return buf.buffer;
}

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

export async function signSession(
  payload: SessionPayload,
  secret: string
): Promise<string> {
  const key = await importHmacKey(secret);
  const data = bufferToBase64url(new TextEncoder().encode(JSON.stringify(payload)).buffer as ArrayBuffer);
  const sig = bufferToBase64url(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data))
  );
  return `${data}.${sig}`;
}

export async function verifySession(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts as [string, string];
  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64urlToBuffer(sig),
    new TextEncoder().encode(data)
  );
  if (!valid) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(
      new TextDecoder().decode(base64urlToBuffer(data))
    ) as SessionPayload;
  } catch {
    return null;
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function getSessionSecret<E extends AppEnv>(c: Context<E>): string {
  const secret = (c.env as AppEnv["Bindings"]).SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET no configurado");
  return secret;
}

export function setSessionCookie<E extends AppEnv>(
  c: Context<E>,
  token: string
): void {
  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`
  );
}

export function clearSessionCookie<E extends AppEnv>(c: Context<E>): void {
  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`
  );
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k?.trim() === name) return v?.trim() ?? null;
  }
  return null;
}

export async function getCurrentUser<E extends AppEnv>(
  c: Context<E>
): Promise<SessionUser | null> {
  const secret = (c.env as AppEnv["Bindings"]).SESSION_SECRET;
  if (!secret) return null;
  const token = getCookieValue(c.req.raw.headers.get("cookie"), SESSION_COOKIE_NAME);
  if (!token) return null;
  const payload = await verifySession(token, secret);
  return payload?.user ?? null;
}

// ---------------------------------------------------------------------------
// authenticateUser — contraseña
// ---------------------------------------------------------------------------

export async function authenticateUser(
  username: string,
  password: string
): Promise<SessionUser | null> {
  const entry = DEMO_USERS[username];
  if (!entry) return null;
  const ok = await verifyPassword(password, entry.hash, entry.salt);
  return ok ? entry.user : null;
}

/** Quick-login: retorna el usuario sin verificar contraseña (solo demo). */
export function quickLoginUser(username: string): SessionUser | null {
  return DEMO_USERS[username]?.user ?? null;
}

// ---------------------------------------------------------------------------
// requireRole middleware
// ---------------------------------------------------------------------------

export function requireRole(required: Role): MiddlewareHandler<AuthEnv> {
  return async (c, next) => {
    const user = await getCurrentUser(c as unknown as Context<AppEnv>);
    if (!user) return c.json({ error: "No autenticado" }, 401);
    if (!hasRole(user.role, required)) return c.json({ error: "Acceso denegado" }, 403);
    c.set("user", user);
    await next();
  };
}
