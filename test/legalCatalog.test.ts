import { describe, expect, it } from "vitest";
import {
  LEGAL_CATALOG,
  LEGAL_INDICATOR_IDS,
  LEGAL_SOURCES,
  LEGAL_SOURCE_IDS,
  getLegalBasis,
} from "../src/domain/legalCatalog";

const entries = LEGAL_INDICATOR_IDS.flatMap((indicator) =>
  LEGAL_CATALOG[indicator].map((entry) => ({ indicator, entry })),
);

describe("catálogo legal curado (W1)", () => {
  it("cada indicador declarado tiene al menos una norma", () => {
    for (const indicator of LEGAL_INDICATOR_IDS) {
      expect(LEGAL_CATALOG[indicator].length).toBeGreaterThan(0);
    }
  });

  it("no hay campos vacíos y la norma coincide con la fuente", () => {
    for (const { entry } of entries) {
      expect(entry.norma.trim().length).toBeGreaterThan(0);
      expect(entry.referencia.trim().length).toBeGreaterThan(0);
      expect(entry.relacion.trim().length).toBeGreaterThan(0);
      expect(LEGAL_SOURCES[entry.sourceId].titulo).toBe(entry.norma);
    }
  });

  it("solo cita artículos cuando el texto fue cotejado", () => {
    for (const { entry } of entries) {
      if (entry.referencia.includes("Art.")) {
        expect(LEGAL_SOURCES[entry.sourceId].articulosVerificados).toBe(true);
      }
    }
  });

  it("las normas de SUDEBAN se citan sin número de artículo", () => {
    const sudeban = entries.filter(({ entry }) => entry.sourceId.startsWith("SUDEBAN"));
    expect(sudeban.length).toBeGreaterThan(0);
    for (const { entry } of sudeban) {
      expect(entry.referencia).not.toMatch(/\bArt\./);
    }
  });

  it("no deja marcadores de verificación pendiente", () => {
    for (const { entry } of entries) {
      expect(entry.referencia.toLowerCase()).not.toContain("verificar");
    }
  });

  it("todas las fuentes están documentadas y usadas", () => {
    const used = new Set(entries.map(({ entry }) => entry.sourceId));
    for (const sourceId of LEGAL_SOURCE_IDS) {
      const source = LEGAL_SOURCES[sourceId];
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.publicacion.trim().length).toBeGreaterThan(0);
      expect(source.nota.trim().length).toBeGreaterThan(0);
      expect(source.verificadoEl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(used.has(sourceId)).toBe(true);
    }
  });

  it("getLegalBasis deduplica y devuelve solo el contrato", () => {
    const basis = getLegalBasis(["SOLICITUD_CREDENCIALES", "SOLICITUD_CREDENCIALES"]);
    expect(basis).toHaveLength(2);
    for (const item of basis) {
      expect(Object.keys(item).sort()).toEqual(["norma", "referencia", "relacion"]);
    }
  });

  it("deduplica referencias compartidas entre indicadores", () => {
    const basis = getLegalBasis(["ACCESO_INDEBIDO", "SOLICITUD_CREDENCIALES"]);
    expect(basis).toHaveLength(2);
  });

  it("sin indicadores no inventa fundamento legal", () => {
    expect(getLegalBasis([])).toEqual([]);
  });
});
