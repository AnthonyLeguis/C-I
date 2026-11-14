import { describe, expect, it } from "vitest";
import seedSql from "../seed/seed_mailbox.sql?raw";
import { DEMO_SCENARIOS } from "../src/application/demoScenarios";
import { levelToFolder, scoreToLevel } from "../src/domain/types";
import { analyzeHeuristics } from "../src/infrastructure/emailHeuristics";

const rows = seedSql.split("INSERT INTO emails").slice(1);

const expectedFolder: Record<string, string> = {
  "sudeban-credenciales": "QUARANTINE",
  "fraude-ceo": "QUARANTINE",
  "factura-macro": "SPAM",
  "tarjeta-acortador": "SPAM",
  "rrhh-legitimo": "INBOX",
  "conciliacion-legitima": "INBOX",
};

describe("seed del buzón (W5)", () => {
  it("tiene 20 correos para analista@banco-demo.com.ve", () => {
    expect(rows).toHaveLength(20);
    for (const row of rows) {
      expect(row).toContain("'analista@banco-demo.com.ve'");
    }
  });

  it("reparte 12 maliciosos y 8 legítimos", () => {
    const malicious = rows.filter((row) => row.includes("'QUARANTINE'") || row.includes("'SPAM'"));
    const legitimate = rows.filter((row) => row.includes("'INBOX'"));
    expect(malicious).toHaveLength(12);
    expect(legitimate).toHaveLength(8);
  });

  it("cada fila tiene carpeta, nivel, score y revisión coherentes", () => {
    for (const row of rows) {
      const match = /'([A-Z]+)', '(SAFE|LOW|HIGH|CRITICAL)', (\d+),/.exec(row);
      expect(match).not.toBeNull();
      if (match === null) continue;

      const folder = match[1] ?? "";
      const risk = match[2] ?? "";
      const score = Number(match[3] ?? "-1");

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      if (folder === "QUARANTINE") {
        expect(risk).toBe("CRITICAL");
        expect(row).toContain("'PENDING'");
      } else if (folder === "SPAM") {
        expect(risk).toBe("HIGH");
        expect(row).toContain("'N/A'");
      } else {
        expect(folder).toBe("INBOX");
        expect(["SAFE", "LOW"]).toContain(risk);
        expect(row).toContain("'N/A'");
      }
    }
  });

  it("los maliciosos traen indicadores y fundamento; los legítimos no", () => {
    for (const row of rows) {
      const match = /'(\[.*?\])', '(\[.*?\])',/.exec(row);
      expect(match).not.toBeNull();
      if (match === null) continue;

      const indicators: unknown = JSON.parse(match[1] ?? "[]");
      const legalBasis: unknown = JSON.parse(match[2] ?? "[]");
      expect(Array.isArray(indicators)).toBe(true);
      expect(Array.isArray(legalBasis)).toBe(true);
      if (!Array.isArray(indicators) || !Array.isArray(legalBasis)) continue;

      const malicious = row.includes("'QUARANTINE'") || row.includes("'SPAM'");
      if (malicious) {
        expect(indicators.length).toBeGreaterThan(0);
        expect(legalBasis.length).toBeGreaterThan(0);
      } else {
        expect(indicators).toEqual([]);
        expect(legalBasis).toEqual([]);
      }
    }
  });

  it("usa solo datos sintéticos y PII enmascarada", () => {
    expect(seedSql).toContain("[CEDULA_PROTEGIDA]");
    expect(seedSql).not.toMatch(/\b[VE]-\d{1,2}\.\d{3}\.\d{3}\b/);
  });

  it("los 6 casos de demo caen en la carpeta esperada", () => {
    expect(DEMO_SCENARIOS).toHaveLength(6);
    for (const scenario of DEMO_SCENARIOS) {
      const result = analyzeHeuristics(scenario.email);
      const folder = levelToFolder(scoreToLevel(result.score));
      expect(folder).toBe(expectedFolder[scenario.id]);
    }
  });
});
