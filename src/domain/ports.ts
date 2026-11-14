// [CAPA 1 — DOMINIO] Puertos: "enchufes" para conectar IA y base de datos sin depender de cuál sea.
import type { AuditModule, RiskLevel } from "./types";

export interface AiGatewayPort {
  /** Recibe SIEMPRE texto ya anonimizado. Devuelve null si falla (se usa el fallback). Hoy: Workers AI; mañana: Ollama on-premise. */
  complete(system: string, user: string): Promise<string | null>;
  /** true si el texto es peligroso, null si no se pudo evaluar. */
  isUnsafe(text: string): Promise<boolean | null>;
  readonly modelName: string;
}

export interface AuditEventInput {
  module: AuditModule;
  emailId: string | null;
  actor: string;
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  actionTaken: string;
  indicators: string[];
  legalBasis: unknown[];
  piiDetected: string[];
  xaiExplanation: string | null;
  aiUsed: boolean;
  aiModel: string | null;
}

export interface AuditRepositoryPort {
  /** Guarda el evento con hash SHA-256 encadenado al anterior. */
  append(event: AuditEventInput): Promise<{ id: string; hash: string }>;
}
