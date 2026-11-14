// Barra superior (distribución del Dashboard_RC): título de la vista a la izquierda; a la derecha las notificaciones (casos pendientes de revisión) y el perfil con su menú (nombre, rol y cerrar
// sesión). El selector claro/oscuro vive en el pie del menú lateral; el estado de la IA, en la Consola de Soporte.
import { Bell, BellOff, ChevronDown, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { DashboardResponse, Role } from "../../types/contracts";
import { AlertBadge } from "./Badges";
import { ROLE_LABEL } from "./levels";
import { Tooltip } from "./Tooltip";

export type PendingCase = DashboardResponse["review_queue"][number];

export interface TopbarProps {
  title: string;
  subtitle?: string;
  user?: { display_name: string; role: Role };
  onMenu: () => void;
  onLogout?: () => void;
  pending?: { count: number; items: PendingCase[] };
  onOpenCase?: (emailId: string) => void;
  actions?: ReactNode;
}

/** «Dra. Sofía Valenzuela» → «SV». */
export function initials(name: string): string {
  const parts = name.replace(/^(dr|dra|ing|lic)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

/** Cierra un menú desplegable al hacer clic afuera o con Esc. */
function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", esc); };
  }, [ref, open, close]);
}

const panelCls = (open: boolean) =>
  `absolute right-0 top-[calc(100%+10px)] z-50 origin-top-right overflow-hidden rounded-card border border-line bg-surface shadow-[0_18px_40px_-12px_rgba(2,6,23,0.35)] transition-[opacity,transform,visibility] duration-200 ease-[cubic-bezier(.16,1,.3,1)] ${open ? "visible scale-100 opacity-100" : "invisible pointer-events-none scale-95 opacity-0"}`;

export function Topbar({ title, subtitle, user, onMenu, onLogout, pending, onOpenCase, actions }: TopbarProps) {
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
        {pending && <Notifications count={pending.count} items={pending.items} onOpenCase={onOpenCase} />}
        {user && <ProfileMenu name={user.display_name} role={user.role} onLogout={onLogout} />}
      </div>
    </header>
  );
}

function Notifications({ count, items, onOpenCase }: { count: number; items: PendingCase[]; onOpenCase?: (emailId: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  const label = count > 0 ? `${count} ${count === 1 ? "caso pendiente" : "casos pendientes"} de revisión` : "Sin notificaciones";

  return (
    <div className="relative" ref={ref}>
      <Tooltip content={label} side="bottom" disabled={open}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label={label}
        className={`press relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${open ? "border-line-strong bg-surface-2 text-ink" : "border-transparent text-ink-2 hover:border-line hover:bg-surface-2 hover:text-ink"}`}>
        <Bell size={18} aria-hidden className={count > 0 ? "origin-top animate-[ci-ring_2.4s_ease-in-out_infinite]" : ""} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-white ring-2 ring-surface">{count > 9 ? "9+" : count}</span>
        )}
      </button>
      </Tooltip>

      <div role="menu" aria-hidden={!open} className={`${panelCls(open)} w-[min(22rem,calc(100vw-2rem))]`}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink">Notificaciones</p>
          {count > 0 && <span className="rounded-full bg-critical-soft px-2 py-0.5 text-[11px] font-semibold text-critical">{count} pendientes</span>}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-ink-muted">
            <BellOff size={22} aria-hidden /> No hay casos pendientes de revisión.
          </div>
        ) : (
          <ul className="max-h-80 divide-y divide-line overflow-y-auto">
            {items.slice(0, 6).map((it) => (
              <li key={it.email_id}>
                <button type="button" role="menuitem" tabIndex={open ? 0 : -1} onClick={() => { setOpen(false); onOpenCase?.(it.email_id); }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${it.risk_score >= 80 ? "bg-critical" : "bg-high"}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{it.subject}</span>
                    <span className="block truncate font-mono text-[11px] text-ink-muted">{it.from_address}</span>
                    <span className="mt-1 flex items-center gap-2">
                      <AlertBadge level={it.risk_score >= 80 ? "CRITICAL" : "HIGH"} score={it.risk_score} />
                      <span className="text-[11px] text-ink-muted">{new Date(it.received_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" role="menuitem" tabIndex={open ? 0 : -1} onClick={() => { setOpen(false); onOpenCase?.(""); }}
          className="block w-full border-t border-line bg-surface-2/60 px-4 py-2.5 text-center text-sm font-semibold text-brand transition-colors hover:bg-surface-2">
          Ver todo en el Buzón
        </button>
      </div>
    </div>
  );
}

function ProfileMenu({ name, role, onLogout }: { name: string; role: Role; onLogout?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  const ini = initials(name);
  const avatar = (size: string) => (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-active to-[var(--logo-accent)] font-semibold text-white shadow-card ${size}`}>{ini}</span>
  );

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Menú de perfil"
        className={`press flex items-center gap-2 rounded-full border py-0.5 pl-0.5 pr-1 transition-colors md:pr-2 ${open ? "border-line-strong bg-surface-2" : "border-transparent hover:border-line hover:bg-surface-2"}`}>
        {avatar("h-9 w-9 text-xs")}
        <span className="hidden min-w-0 text-left leading-tight md:block">
          <span className="block max-w-[160px] truncate text-sm font-semibold text-ink">{name}</span>
          <span className="block max-w-[160px] truncate text-[11px] text-ink-muted">{ROLE_LABEL[role]}</span>
        </span>
        <ChevronDown size={15} aria-hidden className={`hidden text-ink-muted transition-transform duration-200 md:block ${open ? "rotate-180" : ""}`} />
      </button>

      <div role="menu" aria-hidden={!open} className={`${panelCls(open)} w-64`}>
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
