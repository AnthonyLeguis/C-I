import { describe, expect, it } from "vitest";
import app from "../src/index";

const env = {} as never;
const json = (body: unknown) => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("contratos de la API (mocks del F0)", () => {
  it("GET /health", async () => {
    const r = await app.request("/api/v1/health", {}, env);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ status: "ok", service: "C&I" });
  });

  it("POST /mail/analyze devuelve todos los campos del contrato", async () => {
    const r = await app.request("/api/v1/mail/analyze", json({ from_address: "x@sudeban-gob.com", subject: "s", body: "b" }), env);
    const body = (await r.json()) as Record<string, unknown>;
    for (const k of ["event_id", "risk_level", "risk_score", "action_taken", "indicators", "detected_urls", "legal_basis", "xai_explanation", "recommendation", "pii_masked", "ai_used", "ai_model", "human_review_required"]) {
      expect(body).toHaveProperty(k);
    }
  });

  it("POST /mail/analyze rechaza un correo inválido con 400", async () => {
    const r = await app.request("/api/v1/mail/analyze", json({}), env);
    expect(r.status).toBe(400);
  });

  it("GET /dashboard trae los bloques de PLAN_UX §4", async () => {
    const body = (await (await app.request("/api/v1/dashboard", {}, env)).json()) as Record<string, unknown>;
    for (const k of ["kpis", "by_risk_level", "by_folder", "by_indicator_category", "top_impersonated", "timeline", "review_queue", "recent_events", "chain_ok", "ai_status"]) {
      expect(body).toHaveProperty(k);
    }
  });

  it("ruta inexistente → 404 en JSON", async () => {
    const r = await app.request("/api/v1/no-existe", {}, env);
    expect(r.status).toBe(404);
  });
});
