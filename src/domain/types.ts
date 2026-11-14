// [CAPA 1 — DOMINIO] Núcleo puro: sin imports externos.

export type RiskLevel = "SAFE" | "LOW" | "HIGH" | "CRITICAL";
export type Folder = "INBOX" | "SPAM" | "QUARANTINE";
export type ReviewStatus = "N/A" | "PENDING" | "CONFIRMED" | "RESTORED";
export type Role = "ANALYST" | "SUPERVISOR" | "ADMIN";
export type PiiType = "CEDULA" | "TELEFONO" | "CUENTA_BANCARIA" | "CORREO_PERSONAL";
export type AuditModule = "MAIL_ANALYZER" | "ASSISTANT_GUARD" | "REVIEW" | "AUTH";
export type IndicatorCategory =
  | "REMITENTE"
  | "AUTENTICACION"
  | "ENLACES"
  | "ADJUNTOS"
  | "INGENIERIA_SOCIAL"
  | "DATOS_PERSONALES"
  | "OTROS";

export interface LegalBasis {
  norma: string;
  referencia: string;
  relacion: string;
}

export interface Indicator {
  category: IndicatorCategory;
  text: string;
  weight: number;
}

export interface EmailInput {
  fromAddress: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  body: string;
  authResults?: string;
  attachments: string[];
}

export interface EmailVerdict {
  riskLevel: RiskLevel;
  riskScore: number;
  folder: Folder;
  indicators: Indicator[];
  detectedUrls: string[];
  legalBasis: LegalBasis[];
  xaiExplanation: string;
  recommendation: string;
  piiMasked: PiiType[];
  aiUsed: boolean;
  aiModel: string | null;
  humanReviewRequired: boolean;
}

/** Umbrales oficiales (PLAN_UX.md §3.1). */
export function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 20) return "LOW";
  return "SAFE";
}

/** Acción automática según el nivel. */
export function levelToFolder(level: RiskLevel): Folder {
  if (level === "CRITICAL") return "QUARANTINE";
  if (level === "HIGH") return "SPAM";
  return "INBOX";
}

/** Fusión "las reglas deciden, la IA explica": reglas 70 %, IA 30 %. */
export function fuseScores(rulesScore: number, aiScore: number | null): number {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  if (aiScore === null) return clamp(rulesScore);
  return clamp(rulesScore * 0.7 + aiScore * 0.3);
}

export const ROLE_RANK: Record<Role, number> = { ANALYST: 1, SUPERVISOR: 2, ADMIN: 3 };

export function hasRole(userRole: Role, required: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}
