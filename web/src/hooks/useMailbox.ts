// Estado del Buzón (PR G5): vista, correos, correo abierto en el lector (null = listado), simular llegada y revisión humana.
import { useCallback, useEffect, useState } from "react";
import { api } from "../services/apiClient";
import type { DemoScenarioDto, MailboxResponse, MailboxView } from "../types/contracts";

const FOCUS_KEY = "ci-open-email";
const FOCUS_EVENT = "ci-open-email";

/** Pide al Buzón abrir un caso (lo usa la campana de notificaciones). */
export function requestMailboxFocus(emailId: string): void {
  try { sessionStorage.setItem(FOCUS_KEY, emailId); } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new CustomEvent(FOCUS_EVENT, { detail: emailId }));
}
function takeFocusEmail(): string | null {
  try { const id = sessionStorage.getItem(FOCUS_KEY); sessionStorage.removeItem(FOCUS_KEY); return id; } catch { return null; }
}

export function useMailbox() {
  const [focus] = useState(takeFocusEmail); // caso abierto desde la campana de notificaciones
  const [view, setView] = useState<MailboxView>(focus ? "PENDING" : "ALL");
  const [data, setData] = useState<MailboxResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(focus);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<DemoScenarioDto[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (v: MailboxView = view) => {
    try {
      const d = await api.mailbox(v);
      setData(d); setError(null);
      // estilo Gmail: nada se abre solo; si el correo abierto ya no está en la carpeta, se vuelve al listado
      setSelectedId((cur) => (cur && d.emails.some((e) => e.id === cur) ? cur : null));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }, [view]);

  useEffect(() => { void load(view); }, [view, load]);
  // Si el Buzón ya está abierto y se elige otro caso en la campana
  useEffect(() => {
    const on = (e: Event) => { const id = (e as CustomEvent<string>).detail; takeFocusEmail(); if (id) { setView("PENDING"); setSelectedId(id); } };
    window.addEventListener(FOCUS_EVENT, on);
    return () => window.removeEventListener(FOCUS_EVENT, on);
  }, []);
  useEffect(() => { api.scenarios().then((r) => setScenarios(r.scenarios)).catch(() => setScenarios([])); }, []);

  const simulate = useCallback(async (caseId: string) => {
    setBusy(true);
    try {
      const r = await api.deliver(caseId);
      setView("ALL");
      const d = await api.mailbox("ALL");
      // El correo nuevo entra al listado con destello. No se toca la selección: «Simular llegada» solo existe en el
      // listado, y si la persona ya abrió un correo mientras se refrescaba el buzón, el lector debe quedarse abierto.
      setData(d); setFreshId(r.email_id);
      window.setTimeout(() => setFreshId(null), 2200);
      return r;
    } finally { setBusy(false); }
  }, []);

  const review = useCallback(async (id: string, decision: "CONFIRM" | "RESTORE") => {
    const r = await api.review(id, decision);
    await load(view);
    return r;
  }, [load, view]);

  /** G7: acciones en 1 clic. */
  const act = useCallback(async (kind: "approve" | "escalate" | "block", id: string) => {
    if (kind === "block") {
      const e = data?.emails.find((x) => x.id === id);
      const domain = e?.from_address.split("@")[1] ?? "";
      const r = await api.blockDomain(domain, id);
      await load(view);
      return { label: `Dominio ${r.domain} bloqueado`, hash: r.audit_hash };
    }
    const r = kind === "approve" ? await api.approve(id) : await api.escalate(id);
    await load(view);
    return { label: kind === "approve" ? "Correo marcado como seguro" : "Caso escalado a CISO", hash: r.audit_hash };
  }, [data, load, view]);

  const selected = data?.emails.find((e) => e.id === selectedId) ?? null;
  return { view, setView, data, error, reload: () => load(view), selected, selectedId, setSelectedId, freshId, scenarios, simulate, review, act, busy };
}
