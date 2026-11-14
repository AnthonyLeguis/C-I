import { describe, expect, it } from "vitest";
import {
  BANK_ENTITIES,
  OFFICIAL_DOMAINS,
  findOfficialEntity,
  isOfficialDomain,
  normalizeDomain,
} from "../src/infrastructure/bankDomains";

describe("dominios oficiales (W1)", () => {
  it("incluye el banco sintético de la demo", () => {
    expect(isOfficialDomain("banco-demo.com.ve")).toBe(true);
    expect(findOfficialEntity("analista@banco-demo.com.ve")?.id).toBe("BANCO_DEMO");
  });

  it("reconoce entidades oficiales conocidas", () => {
    expect(findOfficialEntity("sudeban.gob.ve")?.id).toBe("SUDEBAN");
    expect(findOfficialEntity("bcv.org.ve")?.id).toBe("BCV");
    expect(findOfficialEntity("banesco.com")?.id).toBe("BANESCO");
    expect(findOfficialEntity("mercantilbanco.com")?.id).toBe("MERCANTIL");
    expect(findOfficialEntity("provincial.com")?.id).toBe("BBVA_PROVINCIAL");
  });

  it("acepta subdominios del dominio oficial", () => {
    expect(isOfficialDomain("mail.banco-demo.com.ve")).toBe(true);
    expect(findOfficialEntity("notificaciones.sudeban.gob.ve")?.id).toBe("SUDEBAN");
  });

  it("rechaza dominios que solo contienen el nombre oficial", () => {
    expect(isOfficialDomain("banco-demo.com.ve.evil.com")).toBe(false);
    expect(isOfficialDomain("evilbanco-demo.com.ve")).toBe(false);
    expect(isOfficialDomain("sudeban-gob.com")).toBe(false);
    expect(findOfficialEntity("banco-demo.com.ve.evil.com")).toBeNull();
  });

  it("normaliza correos, URLs, mayúsculas, puertos y punto final", () => {
    expect(normalizeDomain("  BANCO-DEMO.COM.VE  ")).toBe("banco-demo.com.ve");
    expect(normalizeDomain("analista@Banco-Demo.com.ve")).toBe("banco-demo.com.ve");
    expect(normalizeDomain("https://mail.banco-demo.com.ve:8443/inbox")).toBe("mail.banco-demo.com.ve");
    expect(normalizeDomain("banco-demo.com.ve.")).toBe("banco-demo.com.ve");
  });

  it("devuelve null para entradas que no son dominios", () => {
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
    expect(normalizeDomain("texto sin dominio")).toBeNull();
    expect(normalizeDomain("https://")).toBeNull();
  });

  it("no repite dominios ni entidades y todos son canónicos", () => {
    const ids = BANK_ENTITIES.map((entity) => entity.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(OFFICIAL_DOMAINS).size).toBe(OFFICIAL_DOMAINS.length);
    expect(OFFICIAL_DOMAINS.length).toBeGreaterThanOrEqual(12);
    for (const domain of OFFICIAL_DOMAINS) {
      expect(normalizeDomain(domain)).toBe(domain);
    }
    for (const entity of BANK_ENTITIES) {
      expect(entity.dominios.length).toBeGreaterThan(0);
    }
  });
});
