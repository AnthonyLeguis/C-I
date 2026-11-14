import { describe, expect, it } from "vitest";
import type { AuditEventInput, AuditRepositoryPort } from "../src/domain/ports";
import {
  analyzeEmail,
  type AnalysisAi,
  type EmailPersistencePort,
  type PersistedEmail,
} from "../src/application/analyzeEmail";
import { analyzeHeuristics } from "../src/infrastructure/emailHeuristics";
import { parseEmail } from "../src/infrastructure/emailParser";

const PHISHING = parseEmail({
  from_address: "notificaciones@sudeban-gob.com",
  from_name: "SUDEBAN - Supervisión",
  reply_to: "atencion.sudeban@gmail.com",
  subject: "URGENTE: Actualice sus credenciales antes de la inspección",
  body: "Estimado funcionario, su cédula V-00.000.001 y su cuenta 0102-0000-00-0000000001 serán suspendidas en 24 horas. Ingrese en http://sudeban-gob.com/validar con su clave corporativa.",
  auth_results: "spf=fail; dkim=none; dmarc=fail",
  attachments: ["Resolucion_actualizada.pdf.exe"],
});

function fakeAi(options: {
  reply: string | null;
  onPrompt?: (prompt: string) => void;
}): AnalysisAi {
  return {
    modelName: "fake-model",
    lastModelUsed: options.reply === null ? null : "fake-model",
    complete: async (_system, user) => {
      options.onPrompt?.(user);
      return options.reply;
    },
    isUnsafe: async () => null,
  };
}

function fakePersistence(): { port: EmailPersistencePort; saved: PersistedEmail[] } {
  const saved: PersistedEmail[] = [];
  return {
    port: {
      save: async (email) => {
        saved.push(email);
      },
    },
    saved,
  };
}

function fakeAudit(): { port: AuditRepositoryPort; events: AuditEventInput[] } {
  const events: AuditEventInput[] = [];
  return {
    port: {
      append: async (event) => {
        events.push(event);
        return { id: "audit-1", hash: "a".repeat(64) };
      },
    },
    events,
  };
}

describe("caso de uso analyzeEmail (W4)", () => {
  it("fusiona reglas 0.7 + IA 0.3, anonimiza y persiste/audita", async () => {
    let prompt = "";
    const persistence = fakePersistence();
    const audit = fakeAudit();

    const result = await analyzeEmail(PHISHING, {
      ai: fakeAi({
        reply: '{"score": 90, "explanation": "Señales claras de suplantación y robo de credenciales."}',
        onPrompt: (value) => {
          prompt = value;
        },
      }),
      persistEmail: persistence.port,
      audit: audit.port,
      actor: "jrios",
      newId: () => "00000000-0000-4000-8000-0000000000a1",
      now: () => "2026-11-14T00:00:00.000Z",
    });

    expect(analyzeHeuristics(PHISHING).score).toBe(100);
    expect(result.risk_score).toBe(97);
    expect(result.risk_level).toBe("CRITICAL");
    expect(result.action_taken).toBe("QUARANTINE");
    expect(result.human_review_required).toBe(true);
    expect(result.ai_used).toBe(true);
    expect(result.ai_model).toBe("fake-model");
    expect(result.legal_basis.length).toBeGreaterThan(0);
    expect(result.indicators.length).toBeGreaterThan(0);
    expect(result.indicators[0]).not.toHaveProperty("weight");
    expect(result.pii_masked).toContain("CEDULA");
    expect(result.pii_masked).toContain("CUENTA_BANCARIA");
    expect(result.pii_masked).toContain("CORREO_PERSONAL");

    expect(prompt).not.toContain("V-00.000.001");
    expect(prompt).not.toContain("0102-0000-00-0000000001");
    expect(prompt).not.toContain("atencion.sudeban@gmail.com");

    expect(persistence.saved).toHaveLength(1);
    const saved = persistence.saved[0];
    expect(saved?.id).toBe("00000000-0000-4000-8000-0000000000a1");
    expect(saved?.riskLevel).toBe("CRITICAL");
    expect(saved?.reviewStatus).toBe("PENDING");
    expect(saved?.bodySanitized).not.toContain("V-00.000.001");
    expect(saved?.bodySanitized).not.toContain("0102-0000-00-0000000001");
    expect(saved?.replyTo).not.toContain("gmail.com");

    expect(audit.events).toHaveLength(1);
    const event = audit.events[0];
    expect(event?.module).toBe("MAIL_ANALYZER");
    expect(event?.emailId).toBe("00000000-0000-4000-8000-0000000000a1");
    expect(event?.actor).toBe("jrios");
    expect(event?.actionTaken).toBe("QUARANTINE");
    expect(event?.aiUsed).toBe(true);
    expect(event?.piiDetected).toContain("CEDULA");
  });

  it("cae al motor determinista si la IA devuelve null", async () => {
    const suspicious = parseEmail({
      from_address: "soporte@sudeban-gob.com",
      subject: "",
      body: "",
    });

    const result = await analyzeEmail(suspicious, {
      ai: fakeAi({ reply: null }),
    });

    expect(result.risk_score).toBe(35);
    expect(result.risk_level).toBe("LOW");
    expect(result.action_taken).toBe("INBOX");
    expect(result.ai_used).toBe(false);
    expect(result.ai_model).toBeNull();
    expect(result.xai_explanation).toContain("Análisis determinista");
    expect(result.legal_basis.some((item) => item.norma.includes("Delitos Informáticos"))).toBe(true);
  });

  it("acepta una respuesta de IA con markdown y aplica la fusión", async () => {
    const suspicious = parseEmail({
      from_address: "soporte@sudeban-gob.com",
      subject: "",
      body: "",
    });

    const result = await analyzeEmail(suspicious, {
      ai: fakeAi({
        reply: '```json\n{"score": 100, "explanation": "Suplantación evidente."}\n```',
      }),
    });

    expect(result.risk_score).toBe(55);
    expect(result.risk_level).toBe("HIGH");
    expect(result.action_taken).toBe("SPAM");
    expect(result.ai_used).toBe(true);
    expect(result.xai_explanation).toBe("Suplantación evidente.");
  });

  it("si la IA responde algo inválido, usa el fallback determinista", async () => {
    const suspicious = parseEmail({
      from_address: "soporte@sudeban-gob.com",
      subject: "",
      body: "",
    });

    const result = await analyzeEmail(suspicious, {
      ai: fakeAi({ reply: "No puedo evaluar esto." }),
    });

    expect(result.ai_used).toBe(false);
    expect(result.risk_score).toBe(35);
    expect(result.xai_explanation).toContain("Análisis determinista");
  });

  it("mantiene un correo legítimo en INBOX y sin fundamento legal", async () => {
    const safe = parseEmail({
      from_address: "seguridad@banco-demo.com.ve",
      from_name: "Banco Demo",
      subject: "Aviso de seguridad",
      body: "Este es un aviso informativo sin enlaces.",
      auth_results: "spf=pass; dkim=pass; dmarc=pass",
      attachments: [],
    });

    const result = await analyzeEmail(safe, {
      ai: fakeAi({ reply: '{"score": 10, "explanation": "Correo institucional legítimo."}' }),
    });

    expect(result.risk_score).toBe(3);
    expect(result.risk_level).toBe("SAFE");
    expect(result.action_taken).toBe("INBOX");
    expect(result.human_review_required).toBe(false);
    expect(result.legal_basis).toEqual([]);
    expect(result.indicators).toEqual([]);
  });

  it("funciona sin IA ni D1 (entorno offline y pruebas de contrato)", async () => {
    const safe = parseEmail({
      from_address: "seguridad@banco-demo.com.ve",
      subject: "Hola",
      body: "Cuerpo",
      attachments: [],
    });

    const result = await analyzeEmail(safe);

    expect(result.event_id).toHaveLength(36);
    expect(result.risk_level).toBe("SAFE");
    expect(result.ai_used).toBe(false);
    expect(result.ai_model).toBeNull();
  });
});
