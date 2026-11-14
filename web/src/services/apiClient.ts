// ÚNICO archivo del frontend donde se permite fetch(). Archivo compartido: solo lo modifica Anthony.
import type {
  AnalyzeRequest, AnalyzeResponse, AskResponse, DashboardResponse, Folder, HealthResponse, MailboxResponse, ReviewResponse, User,
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
  logout: () => post<{ ok: boolean }>("/auth/logout", {}),
  me: () => request<{ user: User }>("/auth/me"),
  analyze: (email: AnalyzeRequest) => post<AnalyzeResponse>("/mail/analyze", email),
  mailbox: (folder: Folder) => request<MailboxResponse>(`/mailbox?folder=${folder}`),
  deliver: (caseId: string) => post<{ email_id: string; verdict: AnalyzeResponse }>("/mailbox/deliver", { case_id: caseId }),
  review: (emailId: string, decision: "CONFIRM" | "RESTORE") => post<ReviewResponse>(`/mailbox/${emailId}/review`, { decision }),
  dashboard: () => request<DashboardResponse>("/dashboard"),
  ask: (question: string, emailId: string | null = null) => post<AskResponse>("/assistant/ask", { question, email_id: emailId }),
  verifyAudit: () => request<{ chain_ok: boolean; records: number; broken_at: number | null }>("/audit/verify"),
};
