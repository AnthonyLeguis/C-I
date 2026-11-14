import { describe, expect, it } from "vitest";
import app from "../src/index";
import { signSession, type SessionUser } from "../src/infrastructure/auth";

const SECRET = "ci-test-key-321";
const env = { SESSION_SECRET: SECRET, DEMO_MODE: "true" } as never;

const ANALYST: SessionUser = {
  id: "00000000-0000-4000-8000-000000000001",
  username: "jrios",
  display_name: "Javier Ríos",
  role: "ANALYST",
};

async function analystCookie(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = await signSession({ user: ANALYST, exp }, SECRET);
  return `session=${token}`;
}

const json = (body: unknown, cookie?: string) => {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie !== undefined) headers["cookie"] = cookie;
  return { method: "POST", headers, body: JSON.stringify(body) };
};

describe("contratos de la API", () => {
  it("GET /health", async () => {
    const r = await app.request("/api/v1/health", {}, env);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ status: "ok", service: "C&I" });
  });

  it("POST /mail/analyze sin sesión → 401 (rol ANALYST)", async () => {
    const r = await app.request(
      "/api/v1/mail/analyze",
      json({ from_address: "x@sudeban-gob.com", subject: "s", body: "b" }),
      env,
    );
    expect(r.status).toBe(401);
  });

  it("POST /mail/analyze devuelve todos los campos del contrato", async () => {
    const r = await app.request(
      "/api/v1/mail/analyze",
      json({ from_address: "x@sudeban-gob.com", subject: "s", body: "b" }, await analystCookie()),
      env,
    );
    expect(r.status).toBe(200);
    const body = (await r.json()) as Record<string, unknown>;
    for (const k of [
      "event_id",
      "risk_level",
      "risk_score",
      "action_taken",
      "indicators",
      "detected_urls",
      "legal_basis",
      "xai_explanation",
      "recommendation",
      "pii_masked",
      "ai_used",
      "ai_model",
      "human_review_required",
    ]) {
      expect(body).toHaveProperty(k);
    }
  });

  it("POST /mail/analyze rechaza un correo inválido con 400", async () => {
    const r = await app.request(
      "/api/v1/mail/analyze",
      json({}, await analystCookie()),
      env,
    );
    expect(r.status).toBe(400);
  });

  it("GET /dashboard sin sesión → 401 (G4 exige login)", async () => {
    const r = await app.request("/api/v1/dashboard", {}, env);
    expect(r.status).toBe(401);
  });

  it("ruta inexistente → 404 en JSON", async () => {
    const r = await app.request("/api/v1/no-existe", {}, env);
    expect(r.status).toBe(404);
  });
});

describe("vistas para todos los perfiles, acciones por rol", () => {
  it("el Analista puede leer Consola y Bitácora (no 403), pero no actuar en la Consola (403)", async () => {
    const cookie = await analystCookie();
    for (const path of ["/api/v1/support/status", "/api/v1/audit/events", "/api/v1/domains/blocked"]) {
      // sin base de datos en la prueba la ruta puede fallar (500), pero nunca por permisos (403)
      const r = await Promise.resolve(app.request(path, { headers: { cookie } }, env)).catch(() => null);
      expect(r?.status, path).not.toBe(403);
    }
    const mode = await app.request("/api/v1/support/mode", json({ mode: "RULES" }, cookie), env);
    expect(mode.status).toBe(403);
    const reset = await app.request("/api/v1/support/reset-demo", json({ with_samples: true }, cookie), env);
    expect(reset.status).toBe(403);
    const verify = await app.request("/api/v1/audit/verify", { headers: { cookie } }, env);
    expect(verify.status).toBe(403);
  });
});
