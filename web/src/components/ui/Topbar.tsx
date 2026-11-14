// Barra superior (PR X2): título de la pantalla, estado de IA, usuario con rol y tema. Igual que el prototipo.
import { Menu, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { AiStatus, Role } from "../../types/contracts";
import { ROLE_LABEL } from "./levels";
import { ThemeToggle } from "./ThemeToggle";

const AI_STATUS: Record<AiStatus, { text: string; cls: string }> = {
  ONLINE: { text: "IA EN LÍNEA", cls: "border-safe/40 bg-safe-soft text-safe" },
  FALLBACK: { text: "MODO REGLAS", cls: "border-high/40 bg-high-soft text-high" },
  UNKNOWN: { text: "IA SIN VERIFICAR", cls: "border-line-strong bg-surface-2 text-ink-2" },
};

export interface TopbarProps {
  title: string;
  subtitle?: string;
  aiStatus: AiStatus;
  user?: { display_name: string; role: Role };
  onMenu: () => void;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, aiStatus, user, onMenu, actions }: TopbarProps) {
  const ai = AI_STATUS[aiStatus];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-start gap-3">
        <button type="button" onClick={onMenu} aria-label="Abrir menú" className="press mt-0.5 rounded-control border border-line bg-surface p-2 text-ink-2 hover:text-ink lg:hidden">
          <Menu size={20} aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-ink sm:text-2xl">{title}</h1>
          {subtitle && <p className="truncate text-sm text-ink-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1 text-xs font-semibold ${ai.cls}`}>
          <span className="h-2 w-2 rounded-full bg-current animate-ci-pulse" aria-hidden /> {ai.text}
        </span>
        {user && (
          <span className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 py-1 text-xs font-semibold uppercase text-ink-2">
            <UserRound size={13} aria-hidden /> {user.display_name} · {ROLE_LABEL[user.role]}
          </span>
        )}
      </div>
    </header>
  );
}
