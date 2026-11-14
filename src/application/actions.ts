// [CAPA 2 — APLICACIÓN] Acciones del prototipo (PR G7): marcar seguro, escalar a CISO, bloquear dominios
// y exportar la bitácora. Cada acción queda registrada en la bitácora con hash (G2).
import type { AuditRepositoryPort } from "../domain/ports";
import type { MailboxStorePort } from "./mailbox";

export interface BlockedDomain { domain: string; reason: string; blocked_by: string; email_id: string | null; created_at: string }

export interface DomainStorePort {
  list(): Promise<BlockedDomain[]>;
  isBlocked(domain: string): Promise<boolean>;
  add(d: Omit<BlockedDomain, "created_at">): Promise<void>;
  remove(domain: string): Promise<boolean>;
}

interface Deps { store: MailboxStorePort; audit: AuditRepositoryPort }
interface DomainDeps { audit: AuditRepositoryPort; domains: DomainStorePort }

const log = (deps: { audit: AuditRepositoryPort }, emailId: string | null, actor: string, actionTaken: string, note: string | null = null) =>
  deps.audit.append({ module: "REVIEW", emailId, actor, riskLevel: null, riskScore: null, actionTaken, indicators: [], legalBasis: [], piiDetected: [], xaiExplanation: note, aiUsed: false, aiModel: null });

/** Aprobar / Marcar seguro: vuelve a la bandeja como restaurado. */
export async function approveEmail(id: string, actor: string, deps: Deps) {
  const e = await deps.store.findById(id);
  if (!e) return null;
  await deps.store.updateFolder(id, "INBOX", "RESTORED");
  const { hash } = await log(deps, id, actor, "MARKED_SAFE");
  return { email_id: id, review_status: "RESTORED" as const, folder: "INBOX" as const, audit_hash: hash };
}

/** Escalar a CISO: mantiene la carpeta y marca el caso como escalado. */
export async function escalateEmail(id: string, actor: string, deps: Deps) {
  const e = await deps.store.findById(id);
  if (!e) return null;
  await deps.store.updateFolder(id, e.folder, "ESCALATED");
  const { hash } = await log(deps, id, actor, "ESCALATED_TO_CISO");
  return { email_id: id, review_status: "ESCALATED" as const, folder: e.folder, audit_hash: hash };
}

/** Normaliza un dominio o dirección de correo: "x@Sub.Dominio.com" → "sub.dominio.com". */
export function normalizeDomainInput(raw: string): string | null {
  const d = raw.trim().toLowerCase().replace(/^.*@/, "").replace(/^https?:\/\//, "").split(/[/?#:]/)[0] ?? "";
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) ? d : null;
}

export async function blockDomain(raw: string, reason: string, actor: string, emailId: string | null, deps: DomainDeps) {
  const domain = normalizeDomainInput(raw);
  if (!domain) return { ok: false as const, error: "Dominio inválido.", conflict: false };
  if (await deps.domains.isBlocked(domain)) return { ok: false as const, error: "El dominio ya está bloqueado.", conflict: true };
  await deps.domains.add({ domain, reason, blocked_by: actor, email_id: emailId });
  const { hash } = await log(deps, emailId, actor, "DOMAIN_BLOCKED", `Dominio bloqueado: ${domain}`);
  return { ok: true as const, domain, audit_hash: hash };
}

export async function unblockDomain(raw: string, actor: string, deps: DomainDeps) {
  const domain = normalizeDomainInput(raw);
  if (!domain || !(await deps.domains.remove(domain))) return null;
  const { hash } = await log(deps, null, actor, "DOMAIN_UNBLOCKED", `Dominio desbloqueado: ${domain}`);
  return { domain, audit_hash: hash };
}

/** CSV de la bitácora (separador ; para Excel en español, con comillas escapadas). */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "string" ? v : JSON.stringify(v);
    return `"${s.replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + [columns.join(";"), ...rows.map((r) => columns.map((c) => cell(r[c])).join(";"))].join("\r\n");
}
