// [CAPA 2 — APLICACIÓN] Caso de uso del asistente con guardián ético (PR A3 · Anthony).
// Flujo: anonimizar → reglas del guardián → Llama Guard (segunda opinión) → modelo de chat → registro en bitácora.
import type { AiGatewayPort, AuditRepositoryPort } from "../domain/ports";
import type { PiiType } from "../domain/types";
import { evaluateGuardRules, type BlockReason } from "../infrastructure/ethicsGuard";
import { sanitizePii } from "../infrastructure/piiSanitizer";

export const ASSISTANT_SYSTEM_PROMPT = `Eres C&I, asistente de ciberseguridad para el personal de la banca venezolana.
Tu prioridad es la Tríada CIA (confidencialidad, integridad y disponibilidad).
Solo defiendes: nunca generas exploits, malware, técnicas de evasión ni formas de saltar controles.
Nunca inventas datos ni números de artículos legales; si no tienes el dato, lo dices.
Recibes textos ya anonimizados (marcadores como [CEDULA_PROTEGIDA]); no intentes reconstruir datos personales.
Responde en español claro, en máximo 6 líneas, con este formato:
Hallazgo: ...
Riesgo: ...
Acción recomendada: ...`;

export const BLOCKED_ANSWER =
  "C&I está diseñado exclusivamente para la defensa y protección del banco. No puedo ayudar con esa petición, " +
  "pero sí puedo explicarte cómo protegerte de ese tipo de ataque o cómo reconocerlo.";

export const OFFLINE_ANSWER =
  "Hallazgo: la IA no está disponible en este momento; respondo con recomendaciones generales.\n" +
  "Riesgo: los correos que piden claves, transferencias urgentes o abrir adjuntos inesperados son la vía más común de fraude.\n" +
  "Acción recomendada: no abras enlaces ni adjuntos, verifica al remitente por un canal oficial y reporta el correo al área de seguridad.";

export interface AskInput {
  question: string;
  actor: string;
}

export interface AskResult {
  sanitized_question: string;
  pii_masked: PiiType[];
  blocked: boolean;
  block_reasons: BlockReason[];
  answer: string;
  ai_used: boolean;
  ai_model: string | null;
}

export interface AssistantDeps {
  ai: AiGatewayPort & { readonly lastModelUsed?: string | null };
  audit?: AuditRepositoryPort;
  guardModelName?: string;
}

export async function askAssistant(input: AskInput, deps: AssistantDeps): Promise<AskResult> {
  // 1. Privacidad primero: nada sale sin anonimizar.
  const { sanitized, detected } = sanitizePii(input.question);

  // 2. Reglas deterministas del guardián.
  const rules = evaluateGuardRules(sanitized);
  const reasons = new Set<BlockReason>(rules.reasons);
  let aiUsed = false;
  let aiModel: string | null = null;

  // 3. Segunda opinión con Llama Guard solo si las reglas lo dejaron pasar.
  if (reasons.size === 0) {
    const unsafe = await deps.ai.isUnsafe(sanitized);
    if (unsafe !== null) {
      aiUsed = true;
      aiModel = deps.guardModelName ?? "@cf/meta/llama-guard-3-8b";
    }
    if (unsafe === true) reasons.add("OFFENSIVE_REQUEST");
  }

  const blocked = reasons.size > 0;
  let answer = BLOCKED_ANSWER;

  // 4. Si es legítima, responde el modelo de chat (o el texto de respaldo si la IA no está).
  if (!blocked) {
    const reply = await deps.ai.complete(ASSISTANT_SYSTEM_PROMPT, sanitized);
    if (reply !== null) {
      answer = reply;
      aiUsed = true;
      aiModel = deps.ai.lastModelUsed ?? deps.ai.modelName;
    } else {
      answer = OFFLINE_ANSWER;
    }
  }

  // 5. Bitácora (CA7): todo intento queda registrado, sin el texto original.
  if (deps.audit) {
    await deps.audit.append({
      module: "ASSISTANT_GUARD",
      emailId: null,
      actor: input.actor,
      riskLevel: blocked ? "CRITICAL" : null,
      riskScore: blocked ? 100 : null,
      actionTaken: blocked ? "BLOCKED" : detected.length > 0 ? "SANITIZED" : "ALLOWED",
      indicators: rules.matches,
      legalBasis: [],
      piiDetected: detected,
      xaiExplanation: blocked ? `Bloqueado por: ${[...reasons].join(", ")}` : null,
      aiUsed,
      aiModel,
    });
  }

  return {
    sanitized_question: sanitized,
    pii_masked: detected,
    blocked,
    block_reasons: [...reasons],
    answer,
    ai_used: aiUsed,
    ai_model: aiModel,
  };
}
