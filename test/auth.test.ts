import { describe, expect, it } from "vitest";
import app from "../src/index";
import {
  clearSessionCookie,
  getCurrentUser,
  requireRole,
  SESSION_COOKIE_NAME,
  signSession,
  verifySession,
} from "../src/infrastructure/auth";
import { hashPassword, sha256, verifyPassword } from "../src/infrastructure/hash";
import { Hono } from "hono";
import type { AppEnv } from "../src/env";

const testEnv = {
  SESSION_SECRET: "ci-test-key-321",
} as never;

const jsonPost = (path: string, body: unknown, cookie?: string) => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (cookie) headers["cookie"] = cookie;
  return app.request(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }, testEnv);
};

const getWithCookie = (path: string, cookie?: string) => {
  const headers: Record<string, string> = {};
  if (cookie) headers["cookie"] = cookie;
  return app.request(path, { method: "GET", headers }, testEnv);
};

describe("G1 — Criptografía WebCrypto (hash.ts)", () => {
  it("hashPassword genera hash de 64 caracteres hex y salt de 32 hex", async () => {
    const { hash, salt } = await hashPassword("Demo-2026!");
    expect(hash).toHaveLength(64);
    expect(salt).toHaveLength(32);
    expect(typeof hash).toBe("string");
  });

  it("verifyPassword valida contraseñas correctas e incorrectas", async () => {
    const { hash, salt } = await hashPassword("Demo-2026!");
    const ok = await verifyPassword("Demo-2026!", hash, salt);
    const bad = await verifyPassword("ClaveErronea123", hash, salt);
    expect(ok).toBe(true);
    expect(bad).toBe(false);
  });

  it("sha256 genera el resumen correcto para auditoría", async () => {
    const digest = await sha256("evento-auditoria-inicial");
    expect(digest).toHaveLength(64);
    const digest2 = await sha256("evento-auditoria-inicial");
    expect(digest).toBe(digest2);
  });
});

describe("G1 — Sesión firmada con HMAC (auth.ts)", () => {
  it("firma y verifica un payload de sesión válido", async () => {
    const payload = {
      user: {
        id: "00000000-0000-4000-8000-000000000001",
        username: "supervisor",
        display_name: "Supervisor de seguridad (demo)",
        role: "SUPERVISOR" as const,
      },
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const signed = await signSession(payload, "ci-test-key-321");
    expect(signed).toContain(".");

    const recovered = await verifySession(signed, "ci-test-key-321");
    expect(recovered).not.toBeNull();
    expect(recovered?.user.username).toBe("supervisor");
    expect(recovered?.user.role).toBe("SUPERVISOR");
  });

  it("rechaza sesiones alteradas o con firma inválida", async () => {
    const payload = {
      user: {
        id: "00000000-0000-4000-8000-000000000001",
        username: "supervisor",
        display_name: "Supervisor",
        role: "SUPERVISOR" as const,
      },
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const signed = await signSession(payload, "ci-test-key-321");
    const tampered = signed.slice(0, -4) + "abcd";
    const result = await verifySession(tampered, "ci-test-key-321");
    expect(result).toBeNull();
  });

  it("rechaza sesiones expiradas", async () => {
    const expiredPayload = {
      user: {
        id: "00000000-0000-4000-8000-000000000001",
        username: "supervisor",
        display_name: "Supervisor",
        role: "SUPERVISOR" as const,
      },
      exp: Math.floor(Date.now() / 1000) - 100, // En el pasado
    };
    const signed = await signSession(expiredPayload, "ci-test-key-321");
    const result = await verifySession(signed, "ci-test-key-321");
    expect(result).toBeNull();
  });
});

describe("G1 — Endpoints de autenticación (/api/v1/auth)", () => {
  it("login exitoso con los 3 roles (ADMIN, SUPERVISOR, ANALYST)", async () => {
    const roles = [
      { username: "admin", expectedRole: "ADMIN" },
      { username: "supervisor", expectedRole: "SUPERVISOR" },
      { username: "analista", expectedRole: "ANALYST" },
    ];

    for (const r of roles) {
      const res = await jsonPost("/api/v1/auth/login", {
        username: r.username,
        password: "Demo-2026!",
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { user: { role: string; username: string } };
      expect(data.user.role).toBe(r.expectedRole);
      expect(data.user.username).toBe(r.username);

      const cookie = res.headers.get("set-cookie");
      expect(cookie).toBeTruthy();
      expect(cookie).toContain(SESSION_COOKIE_NAME);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Strict");
    }
  });

  it("login falla con contraseña incorrecta (401)", async () => {
    const res = await jsonPost("/api/v1/auth/login", {
      username: "supervisor",
      password: "ClaveInvalida",
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/inválid/i);
  });

  it("login falla con datos vacíos o incompletos (400)", async () => {
    const res = await jsonPost("/api/v1/auth/login", {});
    expect(res.status).toBe(400);
  });

  it("GET /auth/me devuelve 401 si no hay sesión activa", async () => {
    const res = await getWithCookie("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /auth/me devuelve el usuario cuando la cookie de sesión es válida", async () => {
    const loginRes = await jsonPost("/api/v1/auth/login", {
      username: "supervisor",
      password: "Demo-2026!",
    });
    const setCookie = loginRes.headers.get("set-cookie") ?? "";
    const cookieHeader = setCookie.split(";")[0];

    const meRes = await getWithCookie("/api/v1/auth/me", cookieHeader);
    expect(meRes.status).toBe(200);
    const body = (await meRes.json()) as { user: { username: string; role: string } };
    expect(body.user.username).toBe("supervisor");
    expect(body.user.role).toBe("SUPERVISOR");
  });

  it("POST /auth/logout borra la cookie y devuelve ok", async () => {
    const res = await jsonPost("/api/v1/auth/logout", {});
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("Max-Age=0");
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});

describe("G1 — Middleware requireRole con jerarquía", () => {
  it("permite acceso cuando el rol cumple la jerarquía y rechaza con 403 cuando no", async () => {
    const testApp = new Hono<AppEnv>();
    testApp.use("/supervisor-only", requireRole("SUPERVISOR") as never);
    testApp.get("/supervisor-only", (c) => c.json({ allowed: true }));

    // 1. Sin sesión -> 401
    const unauth = await testApp.request("/supervisor-only", {}, testEnv);
    expect(unauth.status).toBe(401);

    // 2. Sesión como ANALYST intentando acceder a ruta SUPERVISOR -> 403
    const analystToken = await signSession(
      {
        user: {
          id: "2",
          username: "analista",
          display_name: "Analista",
          role: "ANALYST",
        },
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "ci-test-key-321"
    );
    const forbidden = await testApp.request(
      "/supervisor-only",
      { headers: { cookie: `${SESSION_COOKIE_NAME}=${analystToken}` } },
      testEnv
    );
    expect(forbidden.status).toBe(403);

    // 3. Sesión como SUPERVISOR -> 200
    const supervisorToken = await signSession(
      {
        user: {
          id: "1",
          username: "supervisor",
          display_name: "Supervisor",
          role: "SUPERVISOR",
        },
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "ci-test-key-321"
    );
    const allowedSupervisor = await testApp.request(
      "/supervisor-only",
      { headers: { cookie: `${SESSION_COOKIE_NAME}=${supervisorToken}` } },
      testEnv
    );
    expect(allowedSupervisor.status).toBe(200);

    // 4. Sesión como ADMIN (jerarquía superior) -> 200
    const adminToken = await signSession(
      {
        user: {
          id: "3",
          username: "admin",
          display_name: "Admin",
          role: "ADMIN",
        },
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "ci-test-key-321"
    );
    const allowedAdmin = await testApp.request(
      "/supervisor-only",
      { headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` } },
      testEnv
    );
    expect(allowedAdmin.status).toBe(200);
  });
});
