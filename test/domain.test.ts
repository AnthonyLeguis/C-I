import { describe, expect, it } from "vitest";
import { fuseScores, hasRole, levelToFolder, scoreToLevel } from "../src/domain/types";

describe("niveles de riesgo (PLAN_UX §3.1)", () => {
  it.each([
    [0, "SAFE"], [19, "SAFE"], [20, "LOW"], [49, "LOW"], [50, "HIGH"], [79, "HIGH"], [80, "CRITICAL"], [100, "CRITICAL"],
  ] as const)("score %i → %s", (score, level) => {
    expect(scoreToLevel(score)).toBe(level);
  });

  it("acción automática por nivel", () => {
    expect(levelToFolder("SAFE")).toBe("INBOX");
    expect(levelToFolder("LOW")).toBe("INBOX");
    expect(levelToFolder("HIGH")).toBe("SPAM");
    expect(levelToFolder("CRITICAL")).toBe("QUARANTINE");
  });
});

describe("fusión reglas 70 % + IA 30 %", () => {
  it("sin IA usa solo las reglas", () => expect(fuseScores(90, null)).toBe(90));
  it("pondera reglas e IA", () => expect(fuseScores(100, 0)).toBe(70));
  it("limita a 0–100", () => expect(fuseScores(150, 150)).toBe(100));
});

describe("jerarquía de roles", () => {
  it("ADMIN ⊃ SUPERVISOR ⊃ ANALYST", () => {
    expect(hasRole("ADMIN", "SUPERVISOR")).toBe(true);
    expect(hasRole("SUPERVISOR", "ANALYST")).toBe(true);
    expect(hasRole("ANALYST", "SUPERVISOR")).toBe(false);
  });
});
