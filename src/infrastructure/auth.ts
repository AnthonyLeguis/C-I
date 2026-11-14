// [CAPA 3 — INFRAESTRUCTURA] Autenticación y control de roles (PR G1 · Gabriel).
// C&I.md §5.3: Sesión firmada con HMAC en cookie HttpOnly; Secure; SameSite=Strict (8 h) y requireRole.

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
  exp: number; // Unix timestamp en segundos
}

export type AuthEnv = AppEnv & {
  Variables: {
    user: SessionUser;
  };
};

// Fallback en memoria para pruebas unitarias sin base de datos D1 conectada
const DEMO_FALLBACK_USERS: Record<
  string,
  { user: SessionUser; salt: string; hash: string }
> = {
  supervisor: {
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      username: "supervisor",
      display_name: "Supervisor de seguridad (demo)",
      role: "SUPERVISOR",
    },
    salt: "10000000000000000000000000000002",
    hash: "9da21c41ecd136547ebdd93f3e547163524a8a9c722a7a3186466dbf9e0a4ca7",
  },
  analista: {
    user: {
      id: "00000000-0000-4000-8000-000000000002",
      username: "analista",
      display_name: "Analista de seguridad (demo)",
      role: "ANALYST",
    },
    salt: "10000000000000000000000000000003",
    hash: "a7cadf824fcdc278470aaead86b55188b4ac1109c817048f6053228f0bfb50fb",
  },
  analyst: {
    user: {
      id: "00000000-0000-4000-8000-000000000004",
      username: "analyst",
      display_name: "Analista de seguridad (demo · alias)",
      role: "ANALYST",
    },
    salt: "10000000000000000000000000000004",
    hash: "73fa645aac124215f43fc2ed0fb91fa78b9eb9653560f9053618d8076e44fad1",
  },
  admin: {
    user: {
      id: "00000000-0000-4000-8000-000000000003",
      username: "admin",
      display_name: "Administrador de la plataforma (demo)",
      role: "ADMIN",
    },
    salt: "10000000000000000000000000000001",
    hash: "3fa4df95912cae1839c96d08447862761e2b64522735ecf83f6b9cd55852a92f",
  },
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    const b = bytes[i];
    if (b !== undefined) {
      binary += String.fromCharCode(b);
    }
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secretText: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secretText),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Firma un payload de sesión con HMAC-SHA256 usando SESSION_SECRET. */
export async function signSession(
  payload: SessionPayload,
  secretText: string
): Promise<string> {
  const encoder = new TextEncoder();
  const jsonStr = JSON.stringify(payload);
  const payloadB64 = bytesToBase64Url(encoder.encode(jsonStr));

  const key = await getHmacKey(secretText);
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  const signatureB64 = bytesToBase64Url(new Uint8Array(sigBuf));

  return `${payloadB64}.${signatureB64}`;
}

/** Verifica y decodifica un token de sesión firmado. Retorna null si es inválido o expiró. */
export async function verifySession(
  token: string,
  secretText: string
): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) {
    return null;
  }

  try {
    const encoder = new TextEncoder();
    const key = await getHmacKey(secretText);
    const signatureBytes = base64UrlToBytes(signatureB64);

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(payloadB64)
    );

    if (!valid) {
      return null;
    }

    const payloadBytes = base64UrlToBytes(payloadB64);
    const jsonStr = new TextDecoder().decode(payloadBytes);
    const parsed = JSON.parse(jsonStr) as SessionPayload;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typeof parsed.exp === "number" && parsed.exp < nowSeconds) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/** Extrae la cookie de sesión de la petición HTTP. */
export function getSessionCookie(c: Context): string | null {
  const cookieHeader = c.req.header("cookie");
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    const [name, ...val] = part.split("=");
    if (name === SESSION_COOKIE_NAME) {
      return val.join("=");
    }
  }
  return null;
}

/** Establece la cookie de sesión HttpOnly; Secure; SameSite=Strict (8 horas). */
export function setSessionCookie(c: Context, token: string): void {
  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`
  );
}

/** Elimina la cookie de sesión expirándola inmediatamente. */
export function clearSessionCookie(c: Context): void {
  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
}

/** Obtiene el usuario autenticado en la petición actual a partir de la cookie de sesión. */
export async function getCurrentUser<E extends AppEnv = AppEnv>(
  c: Context<E>
): Promise<SessionUser | null> {
  const token = getSessionCookie(c);
  if (!token) return null;
  const env = c.env as AppEnv["Bindings"] | undefined;
  const secret = env?.SESSION_SECRET || "dev-session-key";
  const session = await verifySession(token, secret);
  return session ? session.user : null;
}

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  role: Role;
  password_hash: string;
  salt: string;
}

/**
 * Autentica un usuario contra D1 o el catálogo demo en memoria.
 * Retorna el SessionUser si las credenciales son correctas, o null si son inválidas.
 */
export async function authenticateUser<E extends AppEnv = AppEnv>(
  c: Context<E>,
  usernameInput: string,
  passwordInput: string
): Promise<SessionUser | null> {
  const normUser = usernameInput.trim().toLowerCase();
  const env = c.env as AppEnv["Bindings"] | undefined;

  // 1. Intentar consulta en base de datos D1 si está enlazada
  if (env?.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT id, username, display_name, role, password_hash, salt FROM users WHERE lower(username) = ?"
      )
        .bind(normUser)
        .first<UserRow>();

      if (row && row.password_hash && row.salt) {
        const isValid = await verifyPassword(
          passwordInput,
          row.password_hash,
          row.salt
        );
        if (isValid) {
          return {
            id: row.id,
            username: row.username,
            display_name: row.display_name,
            role: row.role,
          };
        }
        return null;
      }
    } catch (e) {
      console.error("Error consultando tabla users en D1:", e);
    }
  }

  // 2. Respaldo en memoria (demo / pruebas sin D1 instanciado)
  const fallback = DEMO_FALLBACK_USERS[normUser];
  if (fallback) {
    const isValid = await verifyPassword(
      passwordInput,
      fallback.hash,
      fallback.salt
    );
    if (isValid) {
      return fallback.user;
    }
  }

  return null;
}

/**
 * Middleware para exigir un rol mínimo con jerarquía (ADMIN ⊃ SUPERVISOR ⊃ ANALYST).
 * Devuelve 401 si no hay sesión, 403 si el rol es insuficiente.
 */
export function requireRole(minimumRole: Role): MiddlewareHandler<AuthEnv> {
  return async (c, next) => {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json(
        { error: "No autenticado. Inicie sesión para continuar." },
        401
      );
    }

    if (!hasRole(user.role, minimumRole)) {
      return c.json(
        {
          error: `Rol insuficiente. Se requiere nivel ${minimumRole} o superior.`,
        },
        403
      );
    }

    c.set("user", user);
    await next();
  };
}
