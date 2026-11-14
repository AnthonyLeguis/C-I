// [CAPA 2 — APLICACIÓN] Buzón institucional (PR G3): listar, simular llegada y revisión humana.
import type { AuditRepositoryPort } from "../domain/ports";
import type { EmailInput, Folder, ReviewStatus, RiskLevel } from "../domain/types";
import type { MailAnalyzer } from "./interimAnalyzer";

export interface MailboxEmail {
  id: string; recipient: string; fromAddress: string; fromName: string | null; replyTo: string | null;
  subject: string; bodySanitized: string; receivedAt: string; folder: Folder;
  riskLevel: RiskLevel | null; riskScore: number | null; indicators: unknown[]; legalBasis: unknown[];
  xaiExplanation: string | null; reviewStatus: ReviewStatus;
}

export interface MailboxStorePort {
  findByFolder(folder: Folder): Promise<MailboxEmail[]>;
  findById(id: string): Promise<MailboxEmail | null>;
  insert(email: MailboxEmail): Promise<void>;
  updateFolder(id: string, folder: Folder, review: ReviewStatus): Promise<void>;
}

export type MailboxView = Folder | "ALL" | "PENDING";
const FOLDERS: Folder[] = ["INBOX", "SPAM", "QUARANTINE"];
export const DEMO_RECIPIENT = "analista@banco-demo.com.ve";

export async function listMailbox(view: MailboxView, store: MailboxStorePort) {
  const byFolder = await Promise.all(FOLDERS.map((f) => store.findByFolder(f)));
  const all = byFolder.flat().sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  const counts = { INBOX: byFolder[0]?.length ?? 0, SPAM: byFolder[1]?.length ?? 0, QUARANTINE: byFolder[2]?.length ?? 0 };
  const pending = all.filter((e) => e.reviewStatus === "PENDING");
  const emails = view === "ALL" ? all : view === "PENDING" ? pending : all.filter((e) => e.folder === view);
  return { folder: view, counts, total: all.length, pending: pending.length, emails };
}

export interface DeliverDeps {
  store: MailboxStorePort; audit: AuditRepositoryPort; analyze: MailAnalyzer; sanitize: (t: string) => string; newId: () => string; now: () => Date;
  /** G7: si el dominio del remitente está en la lista corporativa de bloqueo, el correo va directo a cuarentena. */
  isBlocked?: (domain: string) => Promise<boolean>;
}

/** Simula la llegada de un correo: lo analiza, lo guarda en su carpeta y lo registra en la bitácora. */
export async function deliverEmail(email: EmailInput, deps: DeliverDeps) {
  let verdict = await deps.analyze(email);
  const senderDomain = email.fromAddress.split("@")[1]?.toLowerCase() ?? "";
  if (deps.isBlocked && senderDomain && (await deps.isBlocked(senderDomain))) {
    verdict = {
      ...verdict, riskLevel: "CRITICAL", riskScore: Math.max(verdict.riskScore, 95), folder: "QUARANTINE", humanReviewRequired: true,
      indicators: [{ category: "REMITENTE", text: `El dominio ${senderDomain} está en la lista corporativa de bloqueo`, weight: 50 }, ...verdict.indicators],
    };
  }
  const id = deps.newId();
  const record: MailboxEmail = {
    id, recipient: DEMO_RECIPIENT, fromAddress: email.fromAddress, fromName: email.fromName ?? null, replyTo: email.replyTo ?? null,
    subject: deps.sanitize(email.subject), bodySanitized: deps.sanitize(email.body), receivedAt: deps.now().toISOString(),
    folder: verdict.folder, riskLevel: verdict.riskLevel, riskScore: verdict.riskScore, indicators: verdict.indicators,
    legalBasis: verdict.legalBasis, xaiExplanation: verdict.xaiExplanation, reviewStatus: verdict.humanReviewRequired ? "PENDING" : "N/A",
  };
  await deps.store.insert(record);
  const { hash } = await deps.audit.append({
    module: "MAIL_ANALYZER", emailId: id, actor: "SYSTEM", riskLevel: verdict.riskLevel, riskScore: verdict.riskScore,
    actionTaken: verdict.folder, indicators: verdict.indicators.map((i) => i.text), legalBasis: verdict.legalBasis,
    piiDetected: verdict.piiMasked, xaiExplanation: verdict.xaiExplanation, aiUsed: verdict.aiUsed, aiModel: verdict.aiModel,
  });
  return { email_id: id, audit_hash: hash, verdict };
}

export type ReviewDecision = "CONFIRM" | "RESTORE";

/** Revisión humana (CISO o Master): confirmar amenaza o restaurar a bandeja. */
export async function reviewEmail(id: string, decision: ReviewDecision, actor: string, deps: { store: MailboxStorePort; audit: AuditRepositoryPort }) {
  const email = await deps.store.findById(id);
  if (!email) return null;
  const folder: Folder = decision === "CONFIRM" ? "QUARANTINE" : "INBOX";
  const review: ReviewStatus = decision === "CONFIRM" ? "CONFIRMED" : "RESTORED";
  await deps.store.updateFolder(id, folder, review);
  const { hash } = await deps.audit.append({
    module: "REVIEW", emailId: id, actor, riskLevel: null, riskScore: email.riskScore,
    actionTaken: decision === "CONFIRM" ? "CONFIRMED_THREAT" : "RESTORED_TO_INBOX", indicators: [], legalBasis: [],
    piiDetected: [], xaiExplanation: null, aiUsed: false, aiModel: null,
  });
  return { email_id: id, review_status: review, folder, audit_hash: hash };
}
