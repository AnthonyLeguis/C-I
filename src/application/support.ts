// [CAPA 2 — APLICACIÓN] Consola de Soporte (PR A6 · Anthony). Solo el rol Master (ADMIN).
// - Modo de operación: ONLINE (reglas + IA) o RULES_ONLY (solo motor determinista).
// - Restablecer la demo: buzón sintético inicial, sin dominios bloqueados y en modo ONLINE.
// La bitácora NO se borra: su cadena de hash debe seguir íntegra; el reinicio queda registrado.
import type { AuditRepositoryPort } from "../domain/ports";

export type OperationMode = "ONLINE" | "RULES_ONLY";
export const OPERATION_MODES: readonly OperationMode[] = ["ONLINE", "RULES_ONLY"];

export interface SupportStorePort {
  getMode(): Promise<OperationMode>;
  setMode(mode: OperationMode): Promise<void>;
  /** Cuenta correos y eventos; lanza error si D1 no responde. */
  counts(): Promise<{ emails: number; audit_events: number; blocked_domains: number }>;
  /** Vuelve a cargar el buzón sintético y vacía la lista de dominios bloqueados. Devuelve los correos cargados. */
  restoreSeed(): Promise<number>;
}

interface Deps { store: SupportStorePort; audit: AuditRepositoryPort }

const log = (audit: AuditRepositoryPort, actor: string, actionTaken: string, note: string) =>
  audit.append({ module: "REVIEW", emailId: null, actor, riskLevel: null, riskScore: null, actionTaken, indicators: [], legalBasis: [], piiDetected: [], xaiExplanation: note, aiUsed: false, aiModel: null });

export async function getSupportStatus(store: SupportStorePort, aiBound: boolean, aiModel: string) {
  let database: { ok: boolean; latency_ms: number | null; emails: number; audit_events: number; blocked_domains: number };
  let mode: OperationMode = "ONLINE";
  try {
    const t0 = Date.now();
    const c = await store.counts();
    const latency = Date.now() - t0;
    mode = await store.getMode();
    database = { ok: true, latency_ms: latency, ...c };
  } catch {
    database = { ok: false, latency_ms: null, emails: 0, audit_events: 0, blocked_domains: 0 };
  }
  const aiActive = aiBound && mode === "ONLINE";
  return {
    mode,
    ai: {
      bound: aiBound,
      active: aiActive,
      model: aiActive ? aiModel : null,
      status: !aiBound ? "NO_DISPONIBLE" : aiActive ? "EN_LINEA" : "APAGADA",
    },
    database,
    mail_source: "BUZON_SIMULADO" as const,
  };
}

export async function setOperationMode(mode: OperationMode, actor: string, deps: Deps) {
  const previous = await deps.store.getMode();
  if (previous === mode) return { mode, changed: false, audit_hash: null };
  await deps.store.setMode(mode);
  const note = mode === "RULES_ONLY" ? "IA apagada: decide solo el motor de reglas" : "IA encendida: reglas 70 % + IA 30 %";
  const { hash } = await log(deps.audit, actor, `SUPPORT_MODE_${mode}`, note);
  return { mode, changed: true, audit_hash: hash };
}

export async function resetDemo(actor: string, deps: Deps) {
  const emails = await deps.store.restoreSeed();
  await deps.store.setMode("ONLINE");
  const { hash } = await log(deps.audit, actor, "SUPPORT_RESET_DEMO", `Demo restablecida: ${emails} correos sintéticos`);
  return { emails, mode: "ONLINE" as const, audit_hash: hash };
}
