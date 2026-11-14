import { describe, expect, it } from "vitest";
import { DEMO_SCENARIOS } from "../src/application/demoScenarios";
import { w4Analyzer } from "../src/presentation/mailboxRoutes";

describe("Buzón: los hallazgos conservan su peso (modal de hallazgos técnicos)", () => {
  it("el analizador del Buzón devuelve indicadores con el peso que suman al puntaje", async () => {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === "sudeban-credenciales") ?? DEMO_SCENARIOS[0];
    const verdict = await w4Analyzer(undefined)(scenario!.email as never);
    expect(verdict.indicators.length).toBeGreaterThan(0);
    expect(verdict.indicators.every((i) => i.weight > 0)).toBe(true);
    expect(verdict.indicators.some((i) => i.weight >= 30)).toBe(true);
  });
});
