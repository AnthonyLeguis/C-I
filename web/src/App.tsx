// Pantalla temporal: estado del sistema + muestra de la paleta (X1).
// Se reemplaza por el enrutado real con X2 (componentes) y G5 (Login/Buzón).
import { useEffect, useState } from "react";
import { AlertTriangle, Info, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "./services/apiClient";
import type { HealthResponse } from "./types/contracts";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { Logo } from "./components/ui/Logo";
import { UiShowcase } from "./pages/UiShowcase";
import { AssistantPreview } from "./pages/AssistantPreview";

type Status = { kind: "loading" } | { kind: "ok"; data: HealthResponse } | { kind: "error"; message: string };

const LEVELS = [
  { label: "SEGURO", range: "0–19", icon: ShieldCheck, cls: "text-safe bg-safe-soft border-safe" },
  { label: "BAJO", range: "20–49", icon: Info, cls: "text-low bg-low-soft border-low" },
  { label: "ALTO", range: "50–79", icon: AlertTriangle, cls: "text-high bg-high-soft border-high" },
  { label: "CRÍTICO", range: "80–100", icon: ShieldAlert, cls: "text-critical bg-critical-soft border-critical" },
] as const;

export function App() {
  // Enrutado temporal: /ui muestra el kit (X2). G5 reemplaza esto con el enrutado real.
  if (window.location.pathname === "/ui") return <UiShowcase />;
  if (window.location.pathname === "/asistente") return <AssistantPreview />;
  return <StatusPage />;
}

function StatusPage() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    api.health()
      .then((data) => setStatus({ kind: "ok", data }))
      .catch((e: unknown) => setStatus({ kind: "error", message: e instanceof Error ? e.message : "Error" }));
  }, []);

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto flex max-w-3xl justify-end">
        <ThemeToggle />
      </div>
      <section className="mx-auto mt-4 max-w-3xl rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <div className="flex justify-center"><Logo className="w-full max-w-sm" /></div>
        <div className="mt-6 text-center">
          {status.kind === "loading" && <p className="text-ink-muted">Verificando el sistema…</p>}
          {status.kind === "ok" && (
            <p className="inline-flex items-center gap-2 rounded-badge border border-safe bg-safe-soft px-3 py-1 text-xs font-semibold text-safe">
              <span className="h-2 w-2 rounded-full bg-safe animate-ci-pulse" aria-hidden /> SISTEMA EN LÍNEA · {status.data.service} v{status.data.version}
            </p>
          )}
          {status.kind === "error" && (
            <p className="inline-flex items-center gap-2 rounded-badge border border-critical bg-critical-soft px-3 py-1 text-xs font-semibold text-critical">
              <ShieldAlert size={14} aria-hidden /> API NO DISPONIBLE · {status.message}
            </p>
          )}
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-2">Niveles de alerta</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LEVELS.map(({ label, range, icon: Icon, cls }) => (
            <li key={label} className={`flex flex-col gap-1 rounded-control border px-3 py-2 ${cls}`}>
              <span className="inline-flex items-center gap-1 text-xs font-semibold"><Icon size={14} aria-hidden /> {label}</span>
              <span className="font-mono text-xs tabular">{range}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" className="rounded-control bg-brand px-4 py-2 text-sm font-semibold text-on-brand">Botón primario</button>
          <span className="inline-flex items-center gap-1 rounded-badge border border-ai bg-ai-soft px-2 py-1 text-xs font-semibold text-ai">
            <Sparkles size={14} aria-hidden /> EXPLICACIÓN GENERADA POR IA · LLAMA 3.3 70B
          </span>
          <span className="inline-flex items-center gap-1 rounded-badge border border-escalated bg-escalated-soft px-2 py-1 text-xs font-semibold text-escalated">
            ESCALADO A CISO
          </span>
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">Base del proyecto · paleta claro/oscuro (X1). Las pantallas llegan con los PR del equipo.</p>
      </section>
    </main>
  );
}
