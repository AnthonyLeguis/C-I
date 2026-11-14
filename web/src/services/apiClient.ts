// ÚNICO archivo del frontend donde se permite fetch(). Archivo compartido: solo lo modifica Anthony.
import type {
  AnalyzeRequest, AnalyzeResponse, AskResponse, DashboardResponse, DeliverResponse, DemoScenarioDto, DemoUser, HealthResponse, MailboxResponse,
  AiMode, AuditEventsResponse, BlockedDomainDto, SupportStatus, MailboxView, ReviewResponse, TimelineQaResponse, User,
} from "../types/contracts";

export class ApiClientError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    credentials: "same-origin",
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data === "object" && data !== null && "error" in data ? String((data as { error: unknown }).error) : "Error de conexión";
    throw new ApiClientError(res.status, msg);
  }
  return data as T;
}

const post = <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) });

export const api = {
  health: () => request<HealthResponse>("/health"),
  login: (username: string, password: string) => post<{ user: User }>("/auth/login", { username, password }),
  quickLogin: (username: string) => post<{ user: User }>("/auth/quick-login", { username }),
  demoUsers: () => request<{ users: DemoUser[] }>("/auth/demo-users"),
  logout: () => post<{ ok: boolean }>("/auth/logout", {}),
  me: () => request<{ user: User }>("/auth/me"),
  analyze: (email: AnalyzeRequest) => post<AnalyzeResponse>("/mail/analyze", email),
  mailbox: (view: MailboxView) => request<MailboxResponse>(`/mailbox?folder=${view}`),
  scenarios: () => request<{ scenarios: DemoScenarioDto[] }>("/mailbox/scenarios"),
  deliver: (caseId: string) => post<DeliverResponse>("/mailbox/deliver", { case_id: caseId }),
  review: (emailId: string, decision: "CONFIRM" | "RESTORE") => post<ReviewResponse>(`/mailbox/${emailId}/review`, { decision }),
  approve: (emailId: string) => post<ReviewResponse>(`/mailbox/${emailId}/approve`, {}),
  escalate: (emailId: string) => post<ReviewResponse>(`/mailbox/${emailId}/escalate`, {}),
  blockDomain: (domain: string, emailId: string | null = null) => post<{ domain: string; audit_hash: string }>("/domains/block", { domain, email_id: emailId ?? undefined }),
  blockedDomains: () => request<{ domains: BlockedDomainDto[] }>("/domains/blocked"),
  unblockDomain: (domain: string) => request<{ domain: string; audit_hash: string }>(`/domains/blocked/${encodeURIComponent(domain)}`, { method: "DELETE" }),
  auditEvents: (f: { module?: string; level?: string; q?: string }) => {
    const p = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]);
    return request<AuditEventsResponse>(`/audit/events?${p.toString()}`);
  },
  supportStatus: () => request<SupportStatus>("/support/status"),
  setAiMode: (mode: AiMode) => post<{ mode: AiMode; audit_hash: string }>("/support/mode", { mode }),
  resetDemo: (withSamples = true) => post<{ ok: boolean; loaded: number }>("/support/reset-demo", { with_samples: withSamples }),
  /** URL directa de descarga (el navegador envía la cookie de sesión). */
  auditCsvUrl: "/api/v1/audit/export.csv",
  dashboard: () => request<DashboardResponse>("/dashboard"),
  ask: (question: string) => post<AskResponse>("/assistant/ask", { question }),
  timelineQa: () => request<TimelineQaResponse>("/timeline-qa"), // MÓDULO ELIMINABLE
  verifyAudit: () => request<{ chain_ok: boolean; total: number; broken_at: string | null }>("/audit/verify"),
};
