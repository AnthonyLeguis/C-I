import { describe, expect, it } from "vitest";
import { EmailParseError, parseEmail, parseRawEmail } from "../src/infrastructure/emailParser";

const RAW_MULTIPART = [
  'From: "SUDEBAN - Supervisión" <notificaciones@sudeban-gob.com>',
  "Reply-To: atencion.sudeban@gmail.com",
  "Return-Path: <rebotes@sudeban-gob.com>",
  "Authentication-Results: mx.banco-demo.com.ve; spf=fail; dkim=none; dmarc=fail",
  "Subject: =?UTF-8?B?VVJHRU5URTogQWN0dWFsaWNlIHN1cyBjcmVkZW5jaWFsZXM=?=",
  "MIME-Version: 1.0",
  'Content-Type: multipart/mixed; boundary="demo-boundary"',
  "",
  "--demo-boundary",
  'Content-Type: text/plain; charset="utf-8"',
  "Content-Transfer-Encoding: base64",
  "",
  "RXN0aW1hZG8gZnVuY2lvbmFyaW8sIGluZ3Jlc2UgZW4gaHR0cDovL3N1ZGViYW4tZ29iLmNvbS92YWxpZGFyLg==",
  "--demo-boundary",
  'Content-Type: application/octet-stream; name="Resolucion_actualizada.pdf.exe"',
  'Content-Disposition: attachment; filename="Resolucion_actualizada.pdf.exe"',
  "Content-Transfer-Encoding: base64",
  "",
  "TVqQAAMAAAAEAAAA",
  "--demo-boundary--",
  "",
].join("\n");

describe("parser de correo (W2)", () => {
  it("extrae encabezados, cuerpo y adjunto de un correo crudo multipart", () => {
    const parsed = parseRawEmail(RAW_MULTIPART);

    expect(parsed.fromAddress).toBe("notificaciones@sudeban-gob.com");
    expect(parsed.fromName).toBe("SUDEBAN - Supervisión");
    expect(parsed.replyTo).toBe("atencion.sudeban@gmail.com");
    expect(parsed.returnPath).toBe("rebotes@sudeban-gob.com");
    expect(parsed.authResults).toContain("spf=fail");
    expect(parsed.subject).toBe("URGENTE: Actualice sus credenciales");
    expect(parsed.body).toBe("Estimado funcionario, ingrese en http://sudeban-gob.com/validar.");
    expect(parsed.urls).toEqual(["http://sudeban-gob.com/validar"]);
    expect(parsed.attachments).toEqual(["Resolucion_actualizada.pdf.exe"]);
  });

  it("despliega encabezados plegados y extrae URLs de HTML con entidades", () => {
    const raw = [
      "From: Banco Demo <seguridad@banco-demo.com.ve>",
      "Subject: Recibo de pago",
      " disponible",
      "Content-Type: text/html; charset=utf-8",
      "",
      '<p>Hola. <a href="https://banco-demo.com.ve/login">Ingrese</a></p>',
      '<img src="http://evil.example/track?id=1&amp;x=2">',
    ].join("\n");

    const parsed = parseEmail(raw);

    expect(parsed.subject).toBe("Recibo de pago disponible");
    expect(parsed.body).toContain("Ingrese");
    expect(parsed.urls).toEqual([
      "https://banco-demo.com.ve/login",
      "http://evil.example/track?id=1&x=2",
    ]);
  });

  it("acepta el JSON del contrato y deduplica URLs y adjuntos", () => {
    const parsed = parseEmail({
      from_address: "notificaciones@sudeban-gob.com",
      from_name: "SUDEBAN - Supervisión",
      reply_to: "atencion.sudeban@gmail.com",
      subject: "URGENTE: Actualice sus credenciales",
      body: "Ingrese en http://sudeban-gob.com/validar. También https://bit.ly/abc.",
      auth_results: "spf=fail; dkim=none; dmarc=fail",
      attachments: ["Resolucion_actualizada.pdf.exe", "Resolucion_actualizada.pdf.exe"],
    });

    expect(parsed.fromAddress).toBe("notificaciones@sudeban-gob.com");
    expect(parsed.fromName).toBe("SUDEBAN - Supervisión");
    expect(parsed.replyTo).toBe("atencion.sudeban@gmail.com");
    expect(parsed.returnPath).toBeUndefined();
    expect(parsed.urls).toEqual(["http://sudeban-gob.com/validar", "https://bit.ly/abc"]);
    expect(parsed.attachments).toEqual(["Resolucion_actualizada.pdf.exe"]);
  });

  it("acepta un string JSON y conserva el asunto", () => {
    const parsed = parseEmail(
      JSON.stringify({
        from_address: "seguridad@banco-demo.com.ve",
        subject: "Aviso de seguridad",
        body: "Visite https://banco-demo.com.ve/avisos",
      }),
    );

    expect(parsed.fromAddress).toBe("seguridad@banco-demo.com.ve");
    expect(parsed.subject).toBe("Aviso de seguridad");
    expect(parsed.urls).toEqual(["https://banco-demo.com.ve/avisos"]);
  });

  it("decodifica quoted-printable con acentos", () => {
    const raw = [
      "From: SUDEBAN <notificaciones@sudeban-gob.com>",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: quoted-printable",
      "",
      "Su clave ser=C3=A1 suspendida. Ingrese en http://sudeban-gob.com/validar=2E",
    ].join("\n");

    const parsed = parseEmail(raw);

    expect(parsed.body).toContain("será");
    expect(parsed.urls).toEqual(["http://sudeban-gob.com/validar"]);
  });

  it("prefiere text/plain, junta URLs de todas las partes y decodifica filename*", () => {
    const raw = [
      "From: Banco Demo <seguridad@banco-demo.com.ve>",
      'Content-Type: multipart/mixed; boundary="b"',
      "",
      "--b",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "Visite https://banco-demo.com.ve/inicio",
      "--b",
      "Content-Type: text/html; charset=utf-8",
      "",
      '<a href="https://banco-demo.com.ve/login">Entrar</a>',
      "--b",
      'Content-Type: application/octet-stream; name="Resolucion.pdf.exe"',
      "Content-Disposition: attachment; filename*=UTF-8''Resoluci%C3%B3n.pdf.exe",
      "",
      "TVqQAA==",
      "--b--",
      "",
    ].join("\n");

    const parsed = parseEmail(raw);

    expect(parsed.body).toBe("Visite https://banco-demo.com.ve/inicio");
    expect(parsed.urls).toEqual([
      "https://banco-demo.com.ve/inicio",
      "https://banco-demo.com.ve/login",
    ]);
    expect(parsed.attachments).toEqual(["Resolución.pdf.exe"]);
  });

  it("respeta el nombre visible entre comillas con coma", () => {
    const raw = [
      'From: "Pérez, Ana" <ana@banco-demo.com.ve>',
      "Subject: Hola",
      "",
      "Cuerpo del correo.",
    ].join("\n");

    const parsed = parseRawEmail(raw);

    expect(parsed.fromAddress).toBe("ana@banco-demo.com.ve");
    expect(parsed.fromName).toBe("Pérez, Ana");
  });

  it("rechaza entradas sin remitente o con tipos inválidos", () => {
    expect(() => parseEmail("")).toThrow(EmailParseError);
    expect(() => parseEmail("Asunto: hola\n\ncuerpo")).toThrow(EmailParseError);
    expect(() => parseEmail({ subject: "sin remitente" })).toThrow(EmailParseError);
    expect(() => parseEmail({ from_address: "a@b.com", attachments: "no-es-lista" })).toThrow(
      EmailParseError,
    );
  });
});
