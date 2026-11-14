// [CAPA 2 — APLICACIÓN] Caso de uso del analizador de correo (PR W4 · Williams).
// Flujo: anonimizar → reglas (W3) → IA (A2) → fusión 0.7/0.3 → carpeta →
// fundamento legal (W1) → bitácora (G2).
//
// "Las reglas deciden, la IA explica": la IA solo aporta el 30 % del puntaje y
// nunca escribe normas ni artículos. Si falla, el motor determinista sigue solo.

import type { AiGatewayPort, AuditRepositoryPort } from "../domain/ports";
import type {
  Folder,
  Indicator,
  IndicatorCategory,
  LegalBasis,
  PiiType,
  ReviewStatus,
  RiskLevel,
} from "../domain/types";
import { fuseScores, levelToFolder, scoreToLevel } from "../domain/types";
import { getLegalBasis } from "../domain/legalCatalog";
import { analyzeHeuristics } from "../infrastructure/emailHeuristics";
import type { ParsedEmail } from "../infrastructure/emailParser";
import { sanitizeMany, sanitizePii } from "../infrastructure/piiSanitizer";

export const MAIL_ANALYSIS_SYSTEM_PROMPT = `Eres C&I, analista de ciberseguridad para la banca venezolana.
Estima de 0 a 100 la probabilidad de que el correo sea phishing o ingeniería social.
Recibes texto ya anonimizado (marcadores como [CEDULA_PROTEGIDA]); no intentes reconstruir datos personales.
No inventes normas ni números de artículo: el fundamento legal lo aporta el catálogo del sistema.
Responde SOLO con un JSON válido, sin markdown ni texto adicional:
{"score": <número entre 0 y 100>, "explanation": "<máximo 2 frases en español>"}
Si no puedes evaluar el correo, responde {"score": 50, "explanation": "No fue posible evaluar el correo con certeza."}.`;

export interface AnalysisAi extends AiGatewayPort {
  readonly lastModelUsed?: string | null;
}

export interface PersistedEmail {
  id: string;
  recipient: string;
  fromAddress: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  bodySanitized: string;
  receivedAt: string;
  folder: Folder;
  riskLevel: RiskLevel;
  riskScore: number;
  indicators: Indicator[];
  legalBasis: LegalBasis[];
  xaiExplanation: string;
  reviewStatus: ReviewStatus;
}

export interface EmailPersistencePort {
  save(email: PersistedEmail): Promise<void>;
}

export interface AnalyzeEmailDeps {
  ai?: AnalysisAi;
  audit?: AuditRepositoryPort;
  persistEmail?: EmailPersistencePort;
  actor?: string;
  recipient?: string;
  /** Inyectables para pruebas deterministas. */
  newId?: () => string;
  now?: () => string;
}

export interface AnalyzeResult {
  event_id: string;
  risk_level: RiskLevel;
  risk_score: number;
  action_taken: Folder;
  indicators: { category: IndicatorCategory; text: string }[];
  detected_urls: string[];
  legal_basis: LegalBasis[];
  xai_explanation: string;
  recommendation: string;
  pii_masked: PiiType[];
  ai_used: boolean;
  ai_model: string | null;
  human_review_required: boolean;
}

interface AiAssessment {
  score: number;
  explanation: string;
  model: string;
}

/** Analiza un correo ya parseado y devuelve el dictamen del contrato. */
export async function analyzeEmail(
  email: ParsedEmail,
  deps: AnalyzeEmailDeps = {},
): Promise<AnalyzeResult> {
  const eventId = deps.newId?.() ?? crypto.randomUUID();
  const receivedAt = deps.now?.() ?? new Date().toISOString();
  const recipient = deps.recipient ?? "analista@banco-demo.com.ve";

  // 1. Privacidad: lo que sale hacia la IA y hacia D1 va anonimizado.
  const sanitized = sanitizeMany([
    email.subject,
    email.body,
    email.fromName ?? "",
    email.replyTo ?? "",
    ...email.attachments,
  ]);
  const subjectSanitized = sanitized.sanitized[0] ?? "";
  const bodySanitized = sanitized.sanitized[1] ?? "";
  const fromNameSanitized = sanitized.sanitized[2] ?? "";
  const replyToSanitized = sanitized.sanitized[3] ?? "";
  const attachmentsSanitized = sanitized.sanitized.slice(4);

  const urlParts = email.urls.map((url) => sanitizePii(url));
  const authPart = sanitizePii(email.authResults ?? "");
  const piiMasked: PiiType[] = [
    ...new Set([
      ...sanitized.detected,
      ...urlParts.flatMap((part) => part.detected),
      ...authPart.detected,
    ]),
  ];

  // 2. Reglas deterministas sobre el correo local (sin enviar nada afuera).
  const heuristics = analyzeHeuristics(email);
  const rulesScore = heuristics.score;
  // La señal de confianza (peso negativo) explica el score, pero no es un "hallazgo"
  // que deba mostrarse como amenaza ni contarse en el dashboard.
  const findings = heuristics.indicators.filter((indicator) => indicator.weight > 0);

  // 3. IA con el texto ya anonimizado (solo el 30 % del puntaje).
  const aiPrompt = buildAiUserPrompt({
    email,
    subject: subjectSanitized,
    body: bodySanitized,
    fromName: fromNameSanitized,
    replyTo: replyToSanitized,
    attachments: attachmentsSanitized,
    urls: urlParts.map((part) => part.sanitized),
    authResults: authPart.sanitized,
  });
  const aiAssessment = await assessWithAi(aiPrompt, deps);

  // 4. Fusión y decisión.
  const finalScore = fuseScores(rulesScore, aiAssessment?.score ?? null);
  const riskLevel = scoreToLevel(finalScore);
  const folder = levelToFolder(riskLevel);
  const legalBasis = getLegalBasis(heuristics.legalIndicators);
  const aiUsed = aiAssessment !== null;
  const aiModel = aiAssessment?.model ?? null;
  const deterministicExplanation = buildDeterministicExplanation(findings, rulesScore);
  const xaiExplanation =
    aiAssessment?.explanation !== undefined && aiAssessment.explanation.trim() !== ""
      ? aiAssessment.explanation.trim().slice(0, 700)
      : deterministicExplanation;
  const reviewStatus: ReviewStatus = riskLevel === "CRITICAL" ? "PENDING" : "N/A";

  // 5. Persistencia (correo + bitácora). En pruebas sin D1 se omiten.
  const persisted: PersistedEmail = {
    id: eventId,
    recipient,
    fromAddress: email.fromAddress,
    fromName: fromNameSanitized === "" ? undefined : fromNameSanitized,
    replyTo: replyToSanitized === "" ? undefined : replyToSanitized,
    subject: subjectSanitized,
    bodySanitized,
    receivedAt,
    folder,
    riskLevel,
    riskScore: finalScore,
    indicators: findings,
    legalBasis,
    xaiExplanation,
    reviewStatus,
  };

  if (deps.persistEmail !== undefined) {
    await deps.persistEmail.save(persisted);
  }

  if (deps.audit !== undefined) {
    await deps.audit.append({
      module: "MAIL_ANALYZER",
      emailId: eventId,
      actor: deps.actor ?? "SYSTEM",
      riskLevel,
      riskScore: finalScore,
      actionTaken: folder,
      indicators: findings.map((indicator) => indicator.text),
      legalBasis,
      piiDetected: piiMasked,
      xaiExplanation,
      aiUsed,
      aiModel,
    });
  }

  return {
    event_id: eventId,
    risk_level: riskLevel,
    risk_score: finalScore,
    action_taken: folder,
    indicators: findings.map(({ category, text }) => ({ category, text })),
    detected_urls: email.urls,
    legal_basis: legalBasis,
    xai_explanation: xaiExplanation,
    recommendation: recommendationFor(riskLevel),
    pii_masked: piiMasked,
    ai_used: aiUsed,
    ai_model: aiModel,
    human_review_required: riskLevel === "CRITICAL",
  };
}

interface PromptInput {
  email: ParsedEmail;
  subject: string;
  body: string;
  fromName: string;
  replyTo: string;
  attachments: readonly string[];
  urls: readonly string[];
  authResults: string;
}

function buildAiUserPrompt(input: PromptInput): string {
  const senderDomain = input.email.fromAddress.split("@")[1] ?? "desconocido";
  const attachments =
    input.attachments.length > 0 ? input.attachments.join(", ") : "ninguno";
  const urls = input.urls.length > 0 ? input.urls.join(", ") : "ninguna";

  return [
    `Dominio del remitente: ${senderDomain}`,
    `Nombre visible: ${input.fromName === "" ? "(sin nombre)" : input.fromName}`,
    `Reply-To: ${input.replyTo === "" ? "(mismo remitente)" : input.replyTo}`,
    `Asunto: ${input.subject}`,
    `Autenticación: ${input.authResults === "" ? "no disponible" : input.authResults}`,
    `Adjuntos: ${attachments}`,
    `URLs: ${urls}`,
    "Cuerpo:",
    input.body.slice(0, 4000),
  ].join("\n");
}

async function assessWithAi(
  prompt: string,
  deps: AnalyzeEmailDeps,
): Promise<AiAssessment | null> {
  if (deps.ai === undefined) return null;

  try {
    const reply = await deps.ai.complete(MAIL_ANALYSIS_SYSTEM_PROMPT, prompt);
    if (reply === null) return null;
    const parsed = parseAiAssessment(reply);
    if (parsed === null) return null;
    return {
      ...parsed,
      model: deps.ai.lastModelUsed ?? deps.ai.modelName,
    };
  } catch {
    return null;
  }
}

function parseAiAssessment(text: string): { score: number; explanation: string } | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  let value: unknown;
  try {
    value = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  const rawScore = record["score"];
  const score =
    typeof rawScore === "number"
      ? rawScore
      : typeof rawScore === "string"
        ? Number(rawScore)
        : Number.NaN;
  if (!Number.isFinite(score)) return null;

  const rawExplanation = record["explanation"];
  const explanation = typeof rawExplanation === "string" ? rawExplanation.trim() : "";
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    explanation,
  };
}

function buildDeterministicExplanation(
  indicators: readonly Indicator[],
  rulesScore: number,
): string {
  if (indicators.length === 0) {
    return "No se detectaron señales de phishing en el correo.";
  }
  const top = indicators
    .slice(0, 3)
    .map((indicator) => indicator.text)
    .join("; ");
  return `Análisis determinista (${rulesScore}/100): ${top}.`;
}

function recommendationFor(level: RiskLevel): string {
  switch (level) {
    case "SAFE":
      return "Sin acciones requeridas.";
    case "LOW":
      return "Revise con atención antes de responder. No abra enlaces ni adjuntos inesperados.";
    case "HIGH":
      return "No abra enlaces ni adjuntos. El correo se envía a spam; verifique al remitente por un canal oficial.";
    case "CRITICAL":
      return "No abra enlaces ni adjuntos. El correo queda en cuarentena; repórtelo al área de seguridad.";
  }
}
