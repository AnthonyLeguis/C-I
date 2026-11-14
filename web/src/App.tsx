// Pantalla temporal del F0: confirma que frontend y API están vivos.
// Se reemplaza por el enrutado real cuando lleguen X2 (componentes) y G5 (Login/Buzón).
import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { api } from "./services/apiClient";
import type { HealthResponse } from "./types/contracts";

type Status = { kind: "loading" } | { kind: "ok"; data: HealthResponse } | { kind: "error"; message: string };

export function App() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    api.health()
      .then((data) => setStatus({ kind: "ok", data }))
      .catch((e: unknown) => setStatus({ kind: "error", message: e instanceof Error ? e.message : "Error" }));
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="bg-surface border border-border rounded-[10px] shadow-sm p-8 max-w-xl w-full text-center">
        <img src="/logo-ci.jpg" alt="C&I · Anticipamos el riesgo. Fortalecemos tu confianza." className="mx-auto w-full max-w-md" />
        <div className="mt-6">
          {status.kind === "loading" && <p className="text-text-muted">Verificando el sistema…</p>}
          {status.kind === "ok" && (
            <p className="inline-flex items-center gap-2 rounded px-3 py-1 bg-safe-bg text-safe font-semibold text-sm">
              <ShieldCheck size={16} aria-hidden /> SISTEMA EN LÍNEA · {status.data.service} v{status.data.version}
            </p>
          )}
          {status.kind === "error" && (
            <p className="inline-flex items-center gap-2 rounded px-3 py-1 bg-critical-bg text-critical font-semibold text-sm">
              <ShieldAlert size={16} aria-hidden /> API NO DISPONIBLE · {status.message}
            </p>
          )}
        </div>
        <p className="mt-4 text-sm text-text-muted">Base del proyecto (F0). Las pantallas llegan con los PR del equipo.</p>
      </section>
    </main>
  );
}
