import { describe, expect, it } from "vitest";
import { DEMO_SCENARIOS, findScenario } from "../src/application/demoScenarios";
import { w4Analyzer } from "../src/presentation/mailboxRoutes";

const expectedFolder: Record<string, string> = {
  "sudeban-credenciales": "QUARANTINE",
  "fraude-ceo": "QUARANTINE",
  "factura-macro": "SPAM",
  "tarjeta-acortador": "SPAM",
  "rrhh-legitimo": "INBOX",
  "conciliacion-legitima": "INBOX",
};

describe("integración W4 → buzón (G3)", () => {
  it("los 6 escenarios de demo caen en la carpeta esperada", async () => {
    const analyze = w4Analyzer(undefined);
    for (const scenario of DEMO_SCENARIOS) {
      const verdict = await analyze(scenario.email);
      expect(verdict.folder).toBe(expectedFolder[scenario.id]);
    }
  });

  it("el falso SUDEBAN conserva indicadores, fundamento y URLs", async () => {
    const scenario = findScenario("sudeban-credenciales");
    expect(scenario).not.toBeNull();
    if (scenario === null) return;

    const verdict = await w4Analyzer(undefined)(scenario.email);

    expect(verdict.riskLevel).toBe("CRITICAL");
    expect(verdict.riskScore).toBeGreaterThanOrEqual(80);
    expect(verdict.humanReviewRequired).toBe(true);
    expect(verdict.indicators.length).toBeGreaterThan(0);
    expect(verdict.legalBasis.length).toBeGreaterThan(0);
    expect(verdict.detectedUrls).toContain("https://sudeban-portal-seguro.com/auth/login-banco");
    expect(verdict.aiUsed).toBe(false);
    expect(verdict.aiModel).toBeNull();
    expect(verdict.recommendation.length).toBeGreaterThan(0);
  });

  it("el correo legítimo de RRHH queda seguro y sin fundamento legal", async () => {
    const scenario = findScenario("rrhh-legitimo");
    expect(scenario).not.toBeNull();
    if (scenario === null) return;

    const verdict = await w4Analyzer(undefined)(scenario.email);

    expect(verdict.folder).toBe("INBOX");
    expect(verdict.riskLevel).toBe("SAFE");
    expect(verdict.legalBasis).toEqual([]);
    expect(verdict.humanReviewRequired).toBe(false);
  });
});
