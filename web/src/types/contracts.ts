// Espejo EXACTO de los contratos de la API (C&I.md §5.2 y PLAN_UX.md §4). Archivo compartido: solo lo modifica Anthony.

export type RiskLevel = "SAFE" | "LOW" | "HIGH" | "CRITICAL";
export type Folder = "INBOX" | "SPAM" | "QUARANTINE";
export type ReviewStatus = "N/A" | "PENDING" | "CONFIRMED" | "RESTORED" | "ESCALATED";
export type Role = "ANALYST" | "SUPERVISOR" | "ADMIN";
export type IndicatorCategory = "REMITENTE" | "AUTENTICACION" | "ENLACES" | "ADJUNTOS" | "INGENIERIA_SOCIAL" | "DATOS_PERSONALES" | "OTROS";
export type AiStatus = "ONLINE" | "FALLBACK" | "UNKNOWN";

export interface User { id: string; username: string; display_name: string; role: Role }
export interface LegalBasis { norma: string; referencia: string; relacion: string }
export interface IndicatorDto { category: IndicatorCategory; text: string }

export interface HealthResponse { status: "ok"; service: string; version: string }

export interface AnalyzeRequest {
  from_address: string;
  from_name?: string;
  reply_to?: string;
  subject: string;
  body: string;
  auth_results?: string;
  attachments: string[];
}

export interface AnalyzeResponse {
  event_id: string;
  risk_level: RiskLevel;
  risk_score: number;
  action_taken: Folder;
  indicators: IndicatorDto[];
  detected_urls: string[];
  legal_basis: LegalBasis[];
  xai_explanation: string;
  recommendation: string;
  pii_masked: string[];
  ai_used: boolean;
  ai_model: string | null;
  human_review_required: boolean;
}

export interface EmailIndicatorDto { category: IndicatorCategory; text: string; weight?: number }

export interface EmailDto {
  id: string;
  recipient: string;
  from_address: string;
  from_name: string | null;
  reply_to: string | null;
  subject: string;
  body_sanitized: string;
  received_at: string;
  folder: Folder;
  risk_level: RiskLevel | null;
  risk_score: number | null;
  indicators: EmailIndicatorDto[];
  legal_basis: LegalBasis[];
  xai_explanation: string | null;
  review_status: ReviewStatus;
}

export type MailboxView = Folder | "ALL" | "PENDING";
export interface MailboxResponse { folder: MailboxView; counts: Record<Folder, number>; total: number; pending: number; emails: EmailDto[] }
export interface DemoScenarioDto { id: string; label: string }
export interface DeliverResponse { email_id: string; audit_hash: string }
export interface BlockedDomainDto { domain: string; reason: string; blocked_by: string; email_id: string | null; created_at: string }
export interface DemoUser { username: string; display_name: string; role: Role }
export interface ReviewResponse { email_id: string; review_status: ReviewStatus; folder: Folder; audit_hash: string }

export interface AskResponse {
  sanitized_question: string;
  pii_masked: string[];
  blocked: boolean;
  block_reasons: ("PROMPT_INJECTION" | "OFFENSIVE_REQUEST")[];
  answer: string;
  ai_used: boolean;
  ai_model: string | null;
}

export interface DashboardResponse {
  generated_at: string;
  kpis: {
    emails_analyzed: number;
    quarantined: number;
    sent_to_spam: number;
    pending_review: number;
    threats_blocked_pct: number;
    avg_risk_score: number;
    pii_protected: number;
    blocked_assistant_requests: number;
  };
  by_risk_level: Record<RiskLevel, number>;
  by_folder: Record<Folder, number>;
  by_indicator_category: Partial<Record<IndicatorCategory, number>>;
  top_impersonated: { entity: string; count: number }[];
  timeline: { hour: string; total: number; threats: number }[];
  review_queue: { email_id: string; subject: string; from_address: string; risk_score: number; received_at: string }[];
  recent_events: { id: string; created_at: string; module: string; actor: string; risk_level: RiskLevel | null; action_taken: string; hash: string }[];
  chain_ok: boolean;
  ai_status: AiStatus;
}

export interface ApiError { error: string }

// ── MÓDULO ELIMINABLE "timeline-qa" ──
export type TimelinePointStatus = "DEVELOPMENT" | "QA" | "PR_ABIERTO" | "PENDIENTE";
export interface TimelinePoint {
  code: string;
  title: string;
  cp: string;
  status: TimelinePointStatus;
  detail: { sha?: string; date?: string; message?: string; number?: number; url?: string; title?: string; created?: string } | null;
}
export interface TimelineDeveloper { id: string; name: string; github: string; total: number; done: number; percent: number; points: TimelinePoint[] }
export interface TimelineQaResponse {
  generated_at: string;
  stored_at: string;
  development_sha: string;
  team: { total: number; done: number; percent: number };
  developers: TimelineDeveloper[];
}
