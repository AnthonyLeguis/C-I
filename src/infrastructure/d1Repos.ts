// [CAPA 3 — INFRAESTRUCTURA] Repositorios D1 (PR G2 · Gabriel).
// C&I.md §5.1: acceso a D1 (emails y audit_events).
// AuditRepository implementa AuditRepositoryPort con hash SHA-256 encadenado.

import type { AiOrigin, Folder, ReviewStatus, RiskLevel } from "../domain/types";
import type { AuditEventInput, AuditRepositoryPort } from "../domain/ports";
import { sha256 } from "./hash";

// ---------------------------------------------------------------------------
// Tipos de fila D1 (internos)
// ---------------------------------------------------------------------------

interface EmailRow {
  id: string;
  recipient: string;
  from_address: string;
  from_name: string | null;
  reply_to: string | null;
  subject: string;
  body_sanitized: string;
  received_at: string;
  folder: string;
  risk_level: string | null;
  risk_score: number | null;
  indicators: string;
  legal_basis: string;
  xai_explanation: string | null;
  review_status: string;
}

interface AuditRow {
  id: string;
  module: string;
  email_id: string | null;
  actor: string;
  risk_level: string | null;
  risk_score: number | null;
  action_taken: string;
  indicators: string;
  legal_basis: string;
  pii_detected: string;
  xai_explanation: string | null;
  ai_used: number;
  ai_model: string | null;
  prev_hash: string | null;
  hash: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Tipos públicos para EmailRepository
// ---------------------------------------------------------------------------

export interface EmailInsertInput {
  id: string;
  recipient: string;
  fromAddress: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  bodySanitized: string;
  receivedAt: string;
  folder: Folder;
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  indicators: unknown[];
  legalBasis: unknown[];
  xaiExplanation: string | null;
  reviewStatus: ReviewStatus;
}

export interface EmailRecord {
  id: string;
  recipient: string;
  fromAddress: string;
  fromName: string | null;
  replyTo: string | null;
  subject: string;
  bodySanitized: string;
  receivedAt: string;
  folder: Folder;
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  indicators: unknown[];
  legalBasis: unknown[];
  xaiExplanation: string | null;
  reviewStatus: ReviewStatus;
}

function rowToEmailRecord(row: EmailRow): EmailRecord {
  return {
    id: row.id,
    recipient: row.recipient,
    fromAddress: row.from_address,
    fromName: row.from_name,
    replyTo: row.reply_to,
    subject: row.subject,
    bodySanitized: row.body_sanitized,
    receivedAt: row.received_at,
    folder: row.folder as Folder,
    riskLevel: row.risk_level as RiskLevel | null,
    riskScore: row.risk_score,
    indicators: safeJson<unknown[]>(row.indicators, []),
    legalBasis: safeJson<unknown[]>(row.legal_basis, []),
    xaiExplanation: row.xai_explanation,
    reviewStatus: row.review_status as ReviewStatus,
  };
}

// ---------------------------------------------------------------------------
// EmailRepository — stateless (recibe D1Database en cada método)
// ---------------------------------------------------------------------------

export class EmailRepository {
  /** Devuelve todos los correos de una carpeta, ordenados por received_at DESC. */
  async findByFolder(db: D1Database, folder: Folder): Promise<EmailRecord[]> {
    const result = await db
      .prepare(`SELECT * FROM emails WHERE folder = ? ORDER BY received_at DESC`)
      .bind(folder)
      .all<EmailRow>();
    return (result.results ?? []).map(rowToEmailRecord);
  }

  /** Devuelve un correo por ID, o null si no existe. */
  async findById(db: D1Database, id: string): Promise<EmailRecord | null> {
    const row = await db
      .prepare(`SELECT * FROM emails WHERE id = ?`)
      .bind(id)
      .first<EmailRow>();
    if (row == null) return null;
    return rowToEmailRecord(row);
  }

  /** Inserta un nuevo correo. */
  async insert(db: D1Database, email: EmailInsertInput): Promise<void> {
    await db
      .prepare(
        `INSERT INTO emails
          (id, recipient, from_address, from_name, reply_to, subject,
           body_sanitized, received_at, folder, risk_level, risk_score,
           indicators, legal_basis, xai_explanation, review_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        email.id,
        email.recipient,
        email.fromAddress,
        email.fromName ?? null,
        email.replyTo ?? null,
        email.subject,
        email.bodySanitized,
        email.receivedAt,
        email.folder,
        email.riskLevel,
        email.riskScore,
        JSON.stringify(email.indicators),
        JSON.stringify(email.legalBasis),
        email.xaiExplanation,
        email.reviewStatus
      )
      .run();
  }

  /** Mueve un correo a otra carpeta y actualiza su reviewStatus. */
  async updateFolder(
    db: D1Database,
    id: string,
    folder: Folder,
    reviewStatus: ReviewStatus
  ): Promise<void> {
    await db
      .prepare(`UPDATE emails SET folder = ?, review_status = ? WHERE id = ?`)
      .bind(folder, reviewStatus, id)
      .run();
  }
}

// ---------------------------------------------------------------------------
// AuditRepository — hash SHA-256 encadenado
// Constructor recibe D1Database para facilitar tests con mocks.
// ---------------------------------------------------------------------------

/** Hash inicial del primer registro (cadena génesis). */
const GENESIS_HASH = "0".repeat(64);

/** Resultado de verificar la cadena de hash. */
export interface ChainVerifyResult {
  chain_ok: boolean;
  total: number;
  broken_at: string | null;
}

export class AuditRepository implements AuditRepositoryPort {
  constructor(private readonly db: D1Database) {}

  /**
   * Guarda un evento con hash SHA-256 encadenado al anterior.
   * hash = SHA256(prev_hash + JSON.stringify(eventData))
   */
  async append(event: AuditEventInput): Promise<{ id: string; hash: string }> {
    // Concurrencia optimista: si otro evento se registró entre la lectura del último hash y la inserción,
    // la inserción condicional no ocurre y se reintenta con el nuevo último hash (la cadena nunca se bifurca).
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = await this.tryAppend(event);
      if (r) return r;
    }
    throw new Error("No se pudo registrar el evento en la bitácora (concurrencia).");
  }

  private async tryAppend(event: AuditEventInput): Promise<{ id: string; hash: string } | null> {
    // 1. Obtener el hash del último registro global (orden de inserción: rowid, sin empates de milisegundos)
    const lastRow = await this.db
      .prepare(`SELECT hash FROM audit_events ORDER BY rowid DESC LIMIT 1`)
      .first<Pick<AuditRow, "hash">>();
    const prevHash = lastRow?.hash ?? GENESIS_HASH;

    // 2. Serializar los datos del evento (determinista) para el hash
    const dataForHash = {
      module: event.module,
      emailId: event.emailId,
      actor: event.actor,
      riskLevel: event.riskLevel,
      riskScore: event.riskScore,
      actionTaken: event.actionTaken,
      indicators: event.indicators,
      legalBasis: event.legalBasis,
      piiDetected: event.piiDetected,
      xaiExplanation: event.xaiExplanation,
      aiUsed: event.aiUsed,
      aiModel: event.aiModel,
    };
    const hash = await sha256(prevHash + JSON.stringify(dataForHash));

    // 3. Insertar el registro solo si el último hash sigue siendo prevHash (sentencia atómica en SQLite)
    const id = crypto.randomUUID();
    const res = await this.db
      .prepare(
        `INSERT INTO audit_events
          (id, module, email_id, actor, risk_level, risk_score,
           action_taken, indicators, legal_basis, pii_detected,
           xai_explanation, ai_used, ai_model, prev_hash, hash)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
         WHERE COALESCE((SELECT hash FROM audit_events ORDER BY rowid DESC LIMIT 1), ?) = ?`
      )
      .bind(
        id,
        event.module,
        event.emailId,
        event.actor,
        event.riskLevel,
        event.riskScore,
        event.actionTaken,
        JSON.stringify(event.indicators),
        JSON.stringify(event.legalBasis),
        JSON.stringify(event.piiDetected),
        event.xaiExplanation,
        event.aiUsed ? 1 : 0,
        event.aiModel,
        prevHash,
        hash,
        GENESIS_HASH,
        prevHash
      )
      .run();

    return (res.meta?.changes ?? 1) > 0 ? { id, hash } : null;
  }

  /**
   * Verifica la integridad de la cadena completa de audit_events.
   * Recomputa cada hash a partir de los datos almacenados y compara.
   */
  async verifyChain(): Promise<ChainVerifyResult> {
    const result = await this.db
      .prepare(
        `SELECT id, module, email_id, actor, risk_level, risk_score,
                action_taken, indicators, legal_basis, pii_detected,
                xai_explanation, ai_used, ai_model, prev_hash, hash
         FROM audit_events
         ORDER BY rowid ASC`
      )
      .all<AuditRow>();

    const rows = result.results ?? [];
    if (rows.length === 0) {
      return { chain_ok: true, total: 0, broken_at: null };
    }

    let expectedPrevHash = GENESIS_HASH;

    for (const row of rows) {
      const dataForHash = {
        module: row.module,
        emailId: row.email_id,
        actor: row.actor,
        riskLevel: row.risk_level,
        riskScore: row.risk_score,
        actionTaken: row.action_taken,
        indicators: safeJson<string[]>(row.indicators, []),
        legalBasis: safeJson<unknown[]>(row.legal_basis, []),
        piiDetected: safeJson<string[]>(row.pii_detected, []),
        xaiExplanation: row.xai_explanation,
        aiUsed: row.ai_used === 1,
        aiModel: row.ai_model,
      };

      const expectedHash = await sha256(
        expectedPrevHash + JSON.stringify(dataForHash)
      );

      if (expectedHash !== row.hash) {
        return { chain_ok: false, total: rows.length, broken_at: row.id };
      }

      expectedPrevHash = row.hash;
    }

    return { chain_ok: true, total: rows.length, broken_at: null };
  }
}

/** Instancia singleton de EmailRepository (stateless). */
export const emailRepository = new EmailRepository();

/** JSON.parse que no tumba un listado completo por una fila dañada. */
function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

/**
 * Origen de la explicación de cada correo (IA o reglas), leído del análisis MAIL_ANALYZER de la bitácora.
 * Consulta por lotes para no superar el límite de parámetros de D1.
 */
export async function aiOriginByEmail(db: D1Database, ids: string[]): Promise<Map<string, AiOrigin>> {
  const out = new Map<string, AiOrigin>();
  for (let i = 0; i < ids.length; i += 90) {
    const chunk = ids.slice(i, i + 90);
    if (chunk.length === 0) continue;
    const r = await db
      .prepare(`SELECT email_id, ai_used, ai_model FROM audit_events WHERE module = 'MAIL_ANALYZER' AND email_id IN (${chunk.map(() => "?").join(", ")}) ORDER BY created_at ASC`)
      .bind(...chunk)
      .all<{ email_id: string; ai_used: number; ai_model: string | null }>();
    for (const row of r.results ?? []) out.set(row.email_id, { aiUsed: row.ai_used === 1, aiModel: row.ai_model });
  }
  return out;
}
