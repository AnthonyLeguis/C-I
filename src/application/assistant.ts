// [CAPA 2 — APLICACIÓN] Caso de uso del asistente con guardián ético (PR A3 · Anthony).
// Flujo: anonimizar → reglas del guardián → contexto cerrado (solo temas del sistema) → Llama Guard (segunda opinión)
// → modelo de chat con el FAQ del proyecto → registro en bitácora.
import type { AiGatewayPort, AuditRepositoryPort } from "../domain/ports";
import type { PiiType } from "../domain/types";
import { evaluateGuardRules, type BlockReason } from "../infrastructure/ethicsGuard";
import { sanitizePii } from "../infrastructure/piiSanitizer";
import { FAQ_CONTEXT, OUT_OF_SCOPE_ANSWER, faqAnswer, isInScope, normalizeOutOfScope } from "./assistantScope";

export const ASSISTANT_SYSTEM_PROMPT = `Eres el asistente del sistema C&I (detección de phishing en el correo corporativo de la banca venezolana).
Trabajas con CONTEXTO CERRADO: solo respondes sobre (a) el uso y funcionamiento del sistema C&I y (b) cómo reconocer o actuar ante correos sospechosos dentro del banco.
Si la pregunta trata de cualquier otra cosa, responde EXACTAMENTE, sin agregar nada: ${OUT_OF_SCOPE_ANSWER}
Solo defiendes: nunca generas exploits, malware, técnicas de evasión ni formas de saltar controles.
Nunca inventas datos ni números de artículos legales; usa solo lo que está en el contexto del sistema.
Recibes textos ya anonimizados (marcadores como [CEDULA_PROTEGIDA]); no intentes reconstruir datos personales.
Responde en español claro, en máximo 6 líneas. Si la pregunta es sobre un correo sospechoso, usa este formato:
Hallazgo: ...
Riesgo: ...
Acción recomendada: ...
Si es una duda de uso del sistema, responde en pasos breves.

Contexto del sistema (FAQ oficial del proyecto):
${FAQ_CONTEXT}`;

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
  out_of_scope: boolean;
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

  // 3. Contexto cerrado: si no trata del sistema ni del correo del banco, no se consulta a la IA.
  let outOfScope = reasons.size === 0 && !isInScope(sanitized);

  // 4. Segunda opinión con Llama Guard solo si las reglas lo dejaron pasar y está dentro del contexto.
  if (reasons.size === 0 && !outOfScope) {
    const unsafe = await deps.ai.isUnsafe(sanitized);
    if (unsafe !== null) {
      aiUsed = true;
      aiModel = deps.guardModelName ?? "@cf/meta/llama-guard-3-8b";
    }
    if (unsafe === true) reasons.add("OFFENSIVE_REQUEST");
  }

  const blocked = reasons.size > 0;
  let answer = blocked ? BLOCKED_ANSWER : OUT_OF_SCOPE_ANSWER;

  // 5. Si es legítima y del sistema, responde el modelo con el FAQ (o el FAQ directo si la IA no está).
  if (!blocked && !outOfScope) {
    const reply = await deps.ai.complete(ASSISTANT_SYSTEM_PROMPT, sanitized);
    if (reply !== null) {
      aiUsed = true;
      aiModel = deps.ai.lastModelUsed ?? deps.ai.modelName;
      const off = normalizeOutOfScope(reply);
      outOfScope = off !== null;
      answer = off ?? reply;
    } else {
      answer = faqAnswer(sanitized) ?? OFFLINE_ANSWER;
    }
  }

  // 6. Bitácora (CA7): todo intento queda registrado, sin el texto original.
  if (deps.audit) {
    await deps.audit.append({
      module: "ASSISTANT_GUARD",
      emailId: null,
      actor: input.actor,
      riskLevel: blocked ? "CRITICAL" : null,
      riskScore: blocked ? 100 : null,
      actionTaken: blocked ? "BLOCKED" : outOfScope ? "OUT_OF_SCOPE" : detected.length > 0 ? "SANITIZED" : "ALLOWED",
      indicators: rules.matches,
      legalBasis: [],
      piiDetected: detected,
      xaiExplanation: blocked ? `Bloqueado por: ${[...reasons].join(", ")}` : outOfScope ? "Pregunta fuera del contexto del sistema" : null,
      aiUsed,
      aiModel,
    });
  }

  return {
    sanitized_question: sanitized,
    pii_masked: detected,
    blocked,
    block_reasons: [...reasons],
    out_of_scope: outOfScope,
    answer,
    ai_used: aiUsed,
    ai_model: aiModel,
  };
}
