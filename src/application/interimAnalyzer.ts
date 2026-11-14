// [CAPA 2 — APLICACIÓN] Analizador PROVISIONAL de solo reglas (apoyo a G3).
// Usa W3 (heurísticas), W1 (catálogo legal) y A1 (PII). Sin IA.
// ⚠️ Cuando entre W4 (analyzeEmail de Williams, con IA y fusión 70/30), el buzón debe usar W4:
// se cambia solo la dependencia `analyze` en src/presentation/mailboxRoutes.ts.
import { getLegalBasis } from "../domain/legalCatalog";
import { levelToFolder, scoreToLevel, type EmailInput, type EmailVerdict } from "../domain/types";
import { analyzeHeuristics } from "../infrastructure/emailHeuristics";
import { sanitizePii } from "../infrastructure/piiSanitizer";

export type MailAnalyzer = (email: EmailInput) => Promise<EmailVerdict>;

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

export const rulesOnlyAnalyzer: MailAnalyzer = async (email) => {
  const urls = [...new Set(email.body.match(URL_RE) ?? [])];
  const h = analyzeHeuristics({ ...email, urls });
  const riskLevel = scoreToLevel(h.score);
  const folder = levelToFolder(riskLevel);
  const risky = h.indicators.filter((i) => i.weight > 0).sort((a, b) => b.weight - a.weight);
  const { detected } = sanitizePii(`${email.subject}\n${email.body}`);

  const xaiExplanation = risky.length
    ? `Se detectaron ${risky.length} señales de riesgo. Las principales: ${risky.slice(0, 3).map((i) => i.text.toLowerCase()).join("; ")}.`
    : "El remitente y el contenido no presentan señales de amenaza según las reglas verificables.";
  const recommendation =
    riskLevel === "CRITICAL" ? "No abrir enlaces ni adjuntos. Mantener en cuarentena y reportar al área de seguridad."
    : riskLevel === "HIGH" ? "No abrir enlaces ni adjuntos. Verificar con el remitente por un canal oficial."
    : riskLevel === "LOW" ? "Revisar con atención antes de responder o descargar adjuntos."
    : "Sin acciones requeridas.";

  return {
    riskLevel,
    riskScore: h.score,
    folder,
    indicators: h.indicators,
    detectedUrls: urls,
    legalBasis: getLegalBasis(h.legalIndicators),
    xaiExplanation,
    recommendation,
    piiMasked: detected,
    aiUsed: false,
    aiModel: null,
    humanReviewRequired: riskLevel === "CRITICAL",
  };
};
