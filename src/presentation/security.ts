// [CAPA 4 — PRESENTACIÓN] Endurecimiento de la API (auditoría de seguridad QA, 14/11).
// Cabeceras de seguridad, protección CSRF por origen y tipo de contenido, límite de tamaño del cuerpo y
// límite de intentos (rate limiting) persistido en D1.
import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv } from "../env";

/** Cabeceras de seguridad para todas las respuestas de la API (JSON, nunca HTML ejecutable). */
export const securityHeaders: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();
  const h = c.res.headers;
  h.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("Referrer-Policy", "no-referrer");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Cross-Origin-Resource-Policy", "same-origin");
  h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (!h.has("Cache-Control")) h.set("Cache-Control", "no-store");
};

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF (defensa en profundidad, además de la cookie SameSite=Strict): toda escritura debe venir del mismo
 * origen (si el navegador envía Origin) y con cuerpo JSON; así un formulario de otro sitio no puede actuar.
 */
export const csrfGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (WRITE_METHODS.has(c.req.method)) {
    const origin = c.req.header("origin");
    if (origin) {
      let sameOrigin = false;
      try { sameOrigin = new URL(origin).host === new URL(c.req.url).host; } catch { sameOrigin = false; }
      if (!sameOrigin) return c.json({ error: "Origen no permitido." }, 403);
    }
    const type = c.req.header("content-type") ?? "";
    const hasBody = (c.req.header("content-length") ?? "0") !== "0" || c.req.header("transfer-encoding") !== undefined;
    if (hasBody && !type.toLowerCase().startsWith("application/json")) {
      return c.json({ error: "El cuerpo debe ser JSON." }, 415);
    }
  }
  await next();
};

/** Límite de tamaño del cuerpo (un correo de demostración cabe de sobra en 64 KB). */
export function bodySizeLimit(maxBytes: number): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const len = Number(c.req.header("content-length") ?? "0");
    if (Number.isFinite(len) && len > maxBytes) return c.json({ error: "La solicitud es demasiado grande." }, 413);
    await next();
  };
}

/** IP del cliente según Cloudflare (o «local» en desarrollo y pruebas). */
export const clientIp = (c: Context<AppEnv>): string => c.req.header("cf-connecting-ip") ?? c.req.header("x-real-ip") ?? "local";

/**
 * Límite de intentos por clave en una ventana fija, contado de forma atómica en D1.
 * Devuelve true si la solicitud puede seguir. Si D1 no está disponible (pruebas unitarias) o falla, permite:
 * un fallo del contador nunca debe dejar el sistema inutilizable durante la demo.
 */
export async function allowRequest(db: D1Database | undefined, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  if (!db) return true;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  try {
    const row = await db
      .prepare(
        `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END,
           window_start = excluded.window_start
         RETURNING count`,
      )
      .bind(key, windowStart)
      .first<{ count: number }>();
    return (row?.count ?? 1) <= limit;
  } catch (e) {
    console.error("rate_limits no disponible:", e);
    return true;
  }
}

/** Middleware de límite de intentos por usuario de la sesión (o por IP si aún no hay sesión). */
export function rateLimit(name: string, limit: number, windowSeconds: number, keyOf?: (c: Context<AppEnv>) => string): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const key = `${name}:${keyOf ? keyOf(c) : clientIp(c)}`;
    if (!(await allowRequest(c.env?.DB, key, limit, windowSeconds))) {
      c.header("Retry-After", String(windowSeconds));
      return c.json({ error: "Demasiadas solicitudes. Espere un momento e intente de nuevo." }, 429);
    }
    await next();
  };
}
