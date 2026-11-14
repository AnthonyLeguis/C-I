// Barra superior (distribución del Dashboard_RC): título de la vista a la izquierda; a la derecha el estado
// de la IA, el selector claro/oscuro y el perfil del usuario con su menú (nombre, rol y cerrar sesión).
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  onLogout?: () => void;
  actions?: ReactNode;
}

/** «Dra. Sofía Valenzuela» → «SV». */
export function initials(name: string): string {
  const parts = name.replace(/^(dr|dra|ing|lic)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

export function Topbar({ title, subtitle, aiStatus, user, onMenu, onLogout, actions }: TopbarProps) {
  const ai = AI_STATUS[aiStatus];
  return (
    <header className="glass sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-line px-4 sm:px-6">
      <button type="button" onClick={onMenu} aria-label="Abrir menú" className="press rounded-control border border-line bg-surface p-2 text-ink-2 hover:text-ink lg:hidden">
        <Menu size={20} aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold leading-tight text-ink sm:text-xl">{title}</h1>
        {subtitle && <p className="hidden truncate text-[13px] text-ink-muted sm:block">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${ai.cls}`} title={ai.text}>
          <span className="h-2 w-2 rounded-full bg-current animate-ci-pulse" aria-hidden />
          <span className="hidden md:inline">{ai.text}</span>
        </span>
        <ThemeToggle />
        {user && <ProfileMenu name={user.display_name} role={user.role} onLogout={onLogout} />}
      </div>
    </header>
  );
}

function ProfileMenu({ name, role, onLogout }: { name: string; role: Role; onLogout?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", esc); };
  }, [open]);

  const ini = initials(name);
  const avatar = (size: string) => (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-active to-[var(--logo-accent)] font-semibold text-white shadow-card ${size}`}>{ini}</span>
  );

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Menú de perfil"
        className="press flex items-center gap-2 rounded-full border border-transparent py-0.5 pl-0.5 pr-1 transition-colors hover:border-line hover:bg-surface-2 md:pr-2">
        {avatar("h-9 w-9 text-xs")}
        <span className="hidden min-w-0 text-left leading-tight md:block">
          <span className="block max-w-[160px] truncate text-sm font-semibold text-ink">{name}</span>
          <span className="block max-w-[160px] truncate text-[11px] text-ink-muted">{ROLE_LABEL[role]}</span>
        </span>
        <ChevronDown size={15} aria-hidden className={`hidden text-ink-muted transition-transform duration-200 md:block ${open ? "rotate-180" : ""}`} />
      </button>

      <div role="menu" aria-hidden={!open}
        className={`absolute right-0 top-[calc(100%+10px)] z-50 w-64 origin-top-right overflow-hidden rounded-card border border-line bg-surface shadow-[0_18px_40px_-12px_rgba(2,6,23,0.35)] transition duration-200 ease-[cubic-bezier(.16,1,.3,1)] ${open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          {avatar("h-10 w-10 text-sm")}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-safe" aria-hidden /> {ROLE_LABEL[role]}
            </p>
          </div>
        </div>
        <button type="button" role="menuitem" tabIndex={open ? 0 : -1} onClick={() => { setOpen(false); onLogout?.(); }}
          className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-ink-2 transition-colors hover:bg-critical-soft hover:text-critical">
          <LogOut size={16} aria-hidden /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
