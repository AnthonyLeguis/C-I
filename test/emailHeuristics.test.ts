import { describe, expect, it } from "vitest";
import { HEURISTIC_WEIGHTS, analyzeHeuristics } from "../src/infrastructure/emailHeuristics";
import type { HeuristicInput } from "../src/infrastructure/emailHeuristics";

function makeEmail(overrides: Partial<HeuristicInput>): HeuristicInput {
  return {
    fromAddress: "seguridad@banco-demo.com.ve",
    subject: "Aviso",
    body: "Mensaje sin enlaces.",
    attachments: [],
    ...overrides,
  };
}

describe("motor de reglas (W3)", () => {
  it("CA1: remitente oficial con SPF, DKIM y DMARC en pass queda en SAFE", () => {
    const result = analyzeHeuristics(
      makeEmail({
        fromName: "Banco Demo",
        subject: "Recibo de pago disponible",
        body: "Hola, su recibo está en https://banco-demo.com.ve/recibos/123.",
        authResults: "spf=pass; dkim=pass; dmarc=pass",
        urls: ["https://banco-demo.com.ve/recibos/123"],
      }),
    );

    expect(result.score).toBe(0);
    expect(result.score).toBeLessThanOrEqual(19);
    expect(result.legalIndicators).toEqual([]);
    expect(result.indicators.some((indicator) => indicator.weight < 0)).toBe(true);
  });

  it("CA2: falso SUDEBAN con Reply-To gratuito y DMARC fail llega a CRITICAL", () => {
    const result = analyzeHeuristics(
      makeEmail({
        fromAddress: "notificaciones@sudeban-gob.com",
        fromName: "SUDEBAN - Supervisión",
        replyTo: "atencion.sudeban@gmail.com",
        subject: "URGENTE: Actualice sus credenciales antes de la inspección",
        body: "Estimado funcionario, su usuario será suspendido en 24 horas. Ingrese en http://sudeban-gob.com/validar con su clave corporativa.",
        authResults: "mx.banco-demo.com.ve; spf=fail; dkim=none; dmarc=fail",
        attachments: ["Resolucion_actualizada.pdf.exe"],
        urls: ["http://sudeban-gob.com/validar"],
      }),
    );

    expect(result.score).toBe(100);
    expect(result.legalIndicators).toContain("DOMINIO_SUPLANTADO");
    expect(result.legalIndicators).toContain("SUPLANTACION_IDENTIDAD");
    expect(result.legalIndicators).toContain("NOMBRE_REMITENTE_INCONSISTENTE");
    expect(result.legalIndicators).toContain("REPLY_TO_GRATUITO");
    expect(result.legalIndicators).toContain("AUTENTICACION_FALLIDA");
    expect(result.legalIndicators).toContain("ADJUNTO_PELIGROSO");
    expect(result.legalIndicators).toContain("URGENCIA_AMENAZA");
    expect(result.legalIndicators).toContain("SOLICITUD_CREDENCIALES");
    expect(result.legalIndicators).toContain("ACCESO_INDEBIDO");
    expect(new Set(result.legalIndicators).size).toBe(result.legalIndicators.length);
  });

  it("CA3: un adjunto .pdf.exe genera el indicador de doble extensión", () => {
    const result = analyzeHeuristics(
      makeEmail({
        fromAddress: "proveedor@example.com",
        subject: "Documento",
        body: "Adjunto la resolución.",
        attachments: ["Resolucion_actualizada.pdf.exe"],
      }),
    );

    expect(result.score).toBe(HEURISTIC_WEIGHTS.DANGEROUS_ATTACHMENT);
    expect(result.indicators).toHaveLength(1);
    expect(result.indicators[0]?.text).toContain("doble extensión");
    expect(result.legalIndicators).toContain("ADJUNTO_PELIGROSO");
  });

  it("suma 35 por un dominio que imita a una entidad oficial", () => {
    const result = analyzeHeuristics(
      makeEmail({
        fromAddress: "soporte@sudeban-gob.com",
        subject: "",
        body: "",
      }),
    );

    expect(result.score).toBe(HEURISTIC_WEIGHTS.DOMAIN_IMITATION);
    expect(result.indicators.some((indicator) => indicator.category === "REMITENTE")).toBe(true);
  });

  it("detecta dominios con errores de tipeo y nombres de marca contenidos", () => {
    const typo = analyzeHeuristics(
      makeEmail({ fromAddress: "soporte@sudebam.gob.ve", subject: "", body: "" }),
    );
    const contained = analyzeHeuristics(
      makeEmail({ fromAddress: "soporte@bancodemo-seguro.com", subject: "", body: "" }),
    );

    expect(typo.score).toBe(HEURISTIC_WEIGHTS.DOMAIN_IMITATION);
    expect(contained.score).toBe(HEURISTIC_WEIGHTS.DOMAIN_IMITATION);
  });

  it("detecta URL con IP y acortadores", () => {
    const ip = analyzeHeuristics(
      makeEmail({
        fromAddress: "usuario@example.com",
        body: "Acceso: http://192.168.1.10/login",
        urls: ["http://192.168.1.10/login"],
      }),
    );
    const shortener = analyzeHeuristics(
      makeEmail({
        fromAddress: "usuario@example.com",
        body: "Acceso: https://bit.ly/abc",
        urls: ["https://bit.ly/abc"],
      }),
    );

    expect(ip.score).toBe(HEURISTIC_WEIGHTS.SUSPICIOUS_LINK);
    expect(ip.legalIndicators).toContain("URL_IP");
    expect(shortener.score).toBe(HEURISTIC_WEIGHTS.SUSPICIOUS_LINK);
    expect(shortener.legalIndicators).toContain("ACORTADOR_URL");
  });

  it("detecta texto de enlace distinto al destino real", () => {
    const result = analyzeHeuristics(
      makeEmail({
        fromAddress: "usuario@example.com",
        body: '<a href="http://evil.example/login">https://banco-demo.com.ve</a>',
        urls: ["http://evil.example/login"],
      }),
    );

    expect(result.score).toBe(HEURISTIC_WEIGHTS.LINK_MISMATCH);
    expect(result.legalIndicators).toEqual(["ENLACE_TEXTO_DESTINO_DISTINTO"]);
  });

  it("suma 15 por Reply-To gratuito o distinto", () => {
    const free = analyzeHeuristics(
      makeEmail({
        fromAddress: "seguridad@example.com",
        replyTo: "atencion@gmail.com",
      }),
    );
    const different = analyzeHeuristics(
      makeEmail({
        fromAddress: "seguridad@example.com",
        replyTo: "respuestas@otro-banco.com",
      }),
    );

    expect(free.score).toBe(HEURISTIC_WEIGHTS.REPLY_TO);
    expect(free.legalIndicators).toContain("REPLY_TO_GRATUITO");
    expect(different.score).toBe(HEURISTIC_WEIGHTS.REPLY_TO);
    expect(different.legalIndicators).toContain("REPLY_TO_DISTINTO");
  });

  it("distingue autenticación fallida (+20) de ausente (+10)", () => {
    const failed = analyzeHeuristics(
      makeEmail({
        fromAddress: "usuario@example.com",
        authResults: "spf=fail; dkim=pass; dmarc=fail",
      }),
    );
    const absent = analyzeHeuristics(
      makeEmail({
        fromAddress: "usuario@example.com",
        authResults: "spf=none; dkim=none",
      }),
    );

    expect(failed.score).toBe(HEURISTIC_WEIGHTS.AUTH_FAILURE);
    expect(absent.score).toBe(HEURISTIC_WEIGHTS.AUTH_ABSENT);
  });

  it("suma 15 por urgencia, 25 por credenciales y 25 por fraude del CEO", () => {
    const urgency = analyzeHeuristics(
      makeEmail({ body: "URGENTE: último aviso de suspensión" }),
    );
    const credentials = analyzeHeuristics(
      makeEmail({ fromAddress: "usuario@example.com", body: "Actualice sus credenciales" }),
    );
    const ceo = analyzeHeuristics(
      makeEmail({
        fromAddress: "usuario@example.com",
        body: "Cambie los datos bancarios del proveedor.",
      }),
    );

    expect(urgency.score).toBe(HEURISTIC_WEIGHTS.URGENCY);
    expect(credentials.score).toBe(HEURISTIC_WEIGHTS.CREDENTIAL_REQUEST);
    expect(ceo.score).toBe(HEURISTIC_WEIGHTS.CEO_FRAUD);
    expect(ceo.legalIndicators).toContain("CAMBIO_DATOS_BANCARIOS");
  });

  it("suma 10 cuando el nombre visible no corresponde al dominio", () => {
    const result = analyzeHeuristics(
      makeEmail({
        fromAddress: "usuario@example.com",
        fromName: "Banco Demo",
      }),
    );

    expect(result.score).toBe(HEURISTIC_WEIGHTS.NAME_MISMATCH);
    expect(result.legalIndicators).toContain("NOMBRE_REMITENTE_INCONSISTENTE");
  });

  it("no marca enlaces externos legítimos ni duplica la confianza oficial", () => {
    const result = analyzeHeuristics(
      makeEmail({
        fromName: "Banco Demo",
        body: "Consulte https://www.google.com para más información.",
        authResults: "spf=pass; dkim=pass; dmarc=pass",
        urls: ["https://www.google.com"],
      }),
    );

    expect(result.score).toBe(0);
    expect(result.indicators).toHaveLength(1);
    expect(result.indicators[0]?.weight).toBe(HEURISTIC_WEIGHTS.OFFICIAL_TRUST);
    expect(result.legalIndicators).toEqual([]);
  });

  it("acota el score a 0–100", () => {
    const result = analyzeHeuristics(
      makeEmail({
        fromAddress: "notificaciones@sudeban-gob.com",
        fromName: "SUDEBAN - Supervisión",
        replyTo: "atencion.sudeban@gmail.com",
        subject: "URGENTE: Actualice sus credenciales",
        body: "Ingrese en http://sudeban-gob.com/validar con su clave. Transferencia urgente a la nueva cuenta del proveedor.",
        authResults: "spf=fail; dkim=none; dmarc=fail",
        attachments: ["Resolucion_actualizada.pdf.exe", "otra.xlsm"],
        urls: ["http://sudeban-gob.com/validar"],
      }),
    );

    expect(result.score).toBe(100);
  });
});
