// Avisos emergentes (PR X2 · PLAN_UX §1.1): entran desde abajo a la derecha y se van solos a los 4 s.
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastTone = "success" | "info" | "error";
interface ToastItem { id: number; tone: ToastTone; title: string; detail?: string }
interface ToastApi { notify: (tone: ToastTone, title: string, detail?: string) => void }

const ToastContext = createContext<ToastApi | null>(null);

const TONE = {
  success: { icon: CheckCircle2, cls: "border-safe/40 text-safe" },
  info: { icon: Info, cls: "border-ai/40 text-ai" },
  error: { icon: TriangleAlert, cls: "border-critical/40 text-critical" },
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((t) => t.id !== id)), []);
  const notify = useCallback<ToastApi["notify"]>((tone, title, detail) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-3), { id, tone, title, detail }]);
    window.setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const api = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {items.map((t) => {
          const { icon: Icon, cls } = TONE[t.tone];
          return (
            <div key={t.id} className={`animate-toast pointer-events-auto flex items-start gap-3 rounded-card border bg-surface p-4 shadow-card ${cls}`}>
              <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.detail && <p className="mt-0.5 truncate font-mono text-xs text-ink-muted">{t.detail}</p>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" className="text-ink-muted hover:text-ink">
                <X size={16} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
