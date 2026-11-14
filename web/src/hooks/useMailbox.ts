// Estado del Buzón (PR G5): vista, correos, selección, simular llegada y revisión humana.
import { useCallback, useEffect, useState } from "react";
import { api } from "../services/apiClient";
import type { DemoScenarioDto, MailboxResponse, MailboxView } from "../types/contracts";

export function useMailbox() {
  const [view, setView] = useState<MailboxView>("ALL");
  const [data, setData] = useState<MailboxResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<DemoScenarioDto[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (v: MailboxView = view) => {
    try {
      const d = await api.mailbox(v);
      setData(d); setError(null);
      setSelectedId((cur) => (cur && d.emails.some((e) => e.id === cur) ? cur : d.emails[0]?.id ?? null));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }, [view]);

  useEffect(() => { void load(view); }, [view, load]);
  useEffect(() => { api.scenarios().then((r) => setScenarios(r.scenarios)).catch(() => setScenarios([])); }, []);

  const simulate = useCallback(async (caseId: string) => {
    setBusy(true);
    try {
      const r = await api.deliver(caseId);
      setView("ALL");
      const d = await api.mailbox("ALL");
      setData(d); setSelectedId(r.email_id); setFreshId(r.email_id);
      window.setTimeout(() => setFreshId(null), 1500);
      return r;
    } finally { setBusy(false); }
  }, []);

  const review = useCallback(async (id: string, decision: "CONFIRM" | "RESTORE") => {
    const r = await api.review(id, decision);
    await load(view);
    return r;
  }, [load, view]);

  const selected = data?.emails.find((e) => e.id === selectedId) ?? null;
  return { view, setView, data, error, reload: () => load(view), selected, selectedId, setSelectedId, freshId, scenarios, simulate, review, busy };
}
