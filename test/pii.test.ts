// PR A1 · Criterio CA4: ningún dato personal queda en claro.
import { describe, expect, it } from "vitest";
import { containsPii, sanitizeMany, sanitizePii } from "../src/infrastructure/piiSanitizer";

describe("anonimizador PII venezolano", () => {
  it.each([
    ["V-00.000.001"],
    ["V00000001"],
    ["E-00.000.002"],
    ["v 0000003"],
  ])("cédula %s", (cedula) => {
    const r = sanitizePii(`Soy ${cedula}, necesito ayuda`);
    expect(r.sanitized).toBe("Soy [CEDULA_PROTEGIDA], necesito ayuda");
    expect(r.detected).toEqual(["CEDULA"]);
  });

  it.each([["0412-0000000"], ["0414 000 0000"], ["+58 424 0000000"], ["04160000000"], ["0426-000-0000"]])("teléfono %s", (tel) => {
    const r = sanitizePii(`Llámame al ${tel} hoy`);
    expect(r.sanitized).toBe("Llámame al [TELEFONO_PROTEGIDO] hoy");
    expect(r.detected).toEqual(["TELEFONO"]);
  });

  it.each([["0102-0000-00-0000000001"], ["01020000000000000001"], ["0134 0000 00 0000000002"]])("cuenta bancaria %s", (cta) => {
    const r = sanitizePii(`Transfiera a la cuenta ${cta}.`);
    expect(r.sanitized).toBe("Transfiera a la cuenta [CUENTA_BANCARIA_PROTEGIDA].");
    expect(r.detected).toEqual(["CUENTA_BANCARIA"]);
  });

  it("correo personal sí, correo corporativo no", () => {
    const r = sanitizePii("Escribe a fulano.demo@gmail.com o a rrhh@banco-demo.com.ve");
    expect(r.sanitized).toBe("Escribe a [CORREO_PERSONAL_PROTEGIDO] o a rrhh@banco-demo.com.ve");
    expect(r.detected).toEqual(["CORREO_PERSONAL"]);
  });

  it("varios datos a la vez (caso del asistente)", () => {
    const r = sanitizePii("Soy V-00.000.001, tlf 0412-0000000, cuenta 0102-0000-00-0000000001.");
    expect(r.sanitized).toBe("Soy [CEDULA_PROTEGIDA], tlf [TELEFONO_PROTEGIDO], cuenta [CUENTA_BANCARIA_PROTEGIDA].");
    expect(new Set(r.detected)).toEqual(new Set(["CEDULA", "TELEFONO", "CUENTA_BANCARIA"]));
    expect(r.count).toBe(3);
    expect(containsPii(r.sanitized)).toBe(false);
  });

  it("no altera textos sin datos personales (sin falsos positivos)", () => {
    const texto = "Resolución 641.10 de SUDEBAN, expediente 2026-0104, monto 1.500.000 Bs, código 4412.";
    const r = sanitizePii(texto);
    expect(r.sanitized).toBe(texto);
    expect(r.detected).toEqual([]);
  });

  it("es idempotente", () => {
    const once = sanitizePii("V-00.000.001 y 0412-0000000").sanitized;
    expect(sanitizePii(once).sanitized).toBe(once);
  });

  it("sanitizeMany une asunto y cuerpo", () => {
    const r = sanitizeMany(["Pago a V-00.000.001", "Escriba al 0414-0000000"]);
    expect(r.sanitized).toEqual(["Pago a [CEDULA_PROTEGIDA]", "Escriba al [TELEFONO_PROTEGIDO]"]);
    expect(r.detected).toEqual(["CEDULA", "TELEFONO"]);
  });
});
