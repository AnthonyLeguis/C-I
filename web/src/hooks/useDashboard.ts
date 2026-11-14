// Datos del Panel (PR G6): carga y refresco cada 30 s.
import { useCallback, useEffect, useState } from "react";
import { api } from "../services/apiClient";
import type { DashboardResponse } from "../types/contracts";

export function useDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    api.dashboard().then((d) => { setData(d); setError(null); }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"));
  }, []);
  useEffect(() => {
    load();
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [load]);
  return { data, error, reload: load };
}
