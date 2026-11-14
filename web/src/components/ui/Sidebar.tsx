// Menú lateral: vidrio que respeta el tema claro/oscuro y deja ver el fondo vivo. En escritorio se
// contrae a un riel de íconos (flecha en el borde, con tooltip por opción y se recuerda); en móvil es un
// cajón deslizable. Encabezado con el emblema del logo, «C&I» y el lema corto.
import { ChevronLeft, LayoutDashboard, Mail, MessageSquareText, ScanSearch, ScrollText, Wrench, X, type LucideIcon } from "lucide-react";
import type { Role } from "../../types/contracts";
import { BrandLockup } from "./Logo";
import { ThemeSwitch } from "./ThemeToggle";

export type NavKey = "panel" | "buzon" | "analizar" | "asistente" | "bitacora" | "soporte";
interface NavItem { key: NavKey; label: string; icon: LucideIcon; minRole: Role; group: "main" | "control" }

export const NAV: NavItem[] = [
  { key: "panel", label: "Panel Principal", icon: LayoutDashboard, minRole: "ANALYST", group: "main" },
  { key: "buzon", label: "Buzón de Alertas", icon: Mail, minRole: "ANALYST", group: "main" },
  { key: "analizar", label: "Analizador de Casos", icon: ScanSearch, minRole: "ANALYST", group: "main" },
  { key: "asistente", label: "Asistente IA", icon: MessageSquareText, minRole: "ANALYST", group: "main" },
  { key: "bitacora", label: "Bitácora de Eventos", icon: ScrollText, minRole: "ANALYST", group: "control" },
  { key: "soporte", label: "Consola de Soporte", icon: Wrench, minRole: "ANALYST", group: "control" },
];
const RANK: Record<Role, number> = { ANALYST: 1, SUPERVISOR: 2, ADMIN: 3 };

export interface SidebarProps {
  active: NavKey;
  role: Role;
  pendingCount?: number;
  open: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onClose: () => void;
  onNavigate: (key: NavKey) => void;
}

export function Sidebar({ active, role, pendingCount = 0, open, collapsed, onToggleCollapsed, onClose, onNavigate }: SidebarProps) {
  const items = NAV.filter((n) => RANK[role] >= RANK[n.minRole]); // todas las vistas para los 3 perfiles; las acciones se limitan dentro de cada vista
  const groups = [
    { id: "main", label: "Menú", items: items.filter((i) => i.group === "main") },
    { id: "control", label: "Control", items: items.filter((i) => i.group === "control") },
  ].filter((g) => g.items.length > 0);
  // En móvil el cajón siempre va expandido; el riel contraído es solo de escritorio (lg+).
  const rail = collapsed;

  return (
    <>
      <div onClick={onClose} aria-hidden className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      {/* El fondo del menú se estira a todo el alto de la página (nunca se ve más corto, ni en capturas de
          página completa); el contenido interno queda fijo a la vista mientras se hace scroll. */}
      <aside
        className={`glass fixed inset-y-0 left-0 z-50 w-[264px] shrink-0 border-r border-line text-ink-2 transition-[transform,width] duration-[260ms] ease-[cubic-bezier(.16,1,.3,1)] max-lg:bg-[var(--glass-strong)] lg:relative lg:inset-auto lg:translate-x-0 lg:self-stretch ${rail ? "lg:w-[76px]" : "lg:w-[248px]"} ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Navegación principal"
      >
        <div className="flex h-full flex-col lg:sticky lg:top-0 lg:h-screen">
        {/* Encabezado con el logo */}
        <div className={`flex h-[72px] items-center border-b border-line px-4 ${rail ? "lg:justify-center lg:px-0" : ""}`}>
          <span className="hidden lg:block"><BrandLockup compact={rail} /></span>
          <span className="lg:hidden"><BrandLockup /></span>
          <button type="button" onClick={onClose} aria-label="Cerrar menú" className="press ml-auto rounded-control p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink lg:hidden">
            <X size={20} aria-hidden />
          </button>
        </div>

        {/* Flecha para contraer / expandir (solo escritorio) */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={rail ? "Expandir menú" : "Contraer menú"}
          title={rail ? "Expandir menú" : "Contraer menú"}
          className="press absolute -right-3.5 top-[58px] z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-surface text-ink-2 shadow-card transition-colors hover:border-brand hover:text-brand lg:flex"
        >
          <ChevronLeft size={16} aria-hidden className={`transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${rail ? "rotate-180" : ""}`} />
        </button>

        <nav className="flex-1 space-y-5 px-3 py-5">
          {groups.map((g) => (
            <div key={g.id}>
              <p className={`mb-2 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted ${rail ? "lg:px-0 lg:text-center" : ""}`}>
                <span className={rail ? "lg:hidden" : ""}>{g.label}</span>
                {rail && <span className="hidden lg:block lg:mx-auto lg:h-px lg:w-6 lg:bg-line-strong" aria-hidden />}
              </p>
              <ul className="space-y-1">
                {g.items.map(({ key, label, icon: Icon }) => {
                  const isActive = key === active;
                  const badge = key === "buzon" && pendingCount > 0;
                  return (
                    <li key={key} className="group relative">
                      <button
                        type="button"
                        onClick={() => { onNavigate(key); onClose(); }}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={label}
                        className={`press relative flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors ${rail ? "lg:justify-center lg:px-0" : ""} ${isActive ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2 hover:text-ink"}`}
                      >
                        {isActive && <span className={`absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-brand ${rail ? "lg:hidden" : ""}`} aria-hidden />}
                        <span className="relative">
                          <Icon size={19} aria-hidden />
                          {badge && rail && <span className="absolute -right-1 -top-1 hidden h-2.5 w-2.5 rounded-full bg-critical ring-2 ring-surface lg:block" aria-hidden />}
                        </span>
                        <span className={`flex-1 truncate text-left ${rail ? "lg:hidden" : ""}`}>{label}</span>
                        {badge && <span className={`rounded-full bg-critical px-1.5 text-[11px] font-bold leading-5 text-white ${rail ? "lg:hidden" : ""}`}>{pendingCount}</span>}
                      </button>
                      {rail && <span role="tooltip" className="nav-tip z-50 hidden rounded-control bg-console px-2.5 py-1.5 text-xs font-medium text-white shadow-card lg:block">{label}{badge ? ` · ${pendingCount}` : ""}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Pie: interruptor claro/oscuro y firma */}
        <div className={`space-y-2 border-t border-line px-3 py-3 ${rail ? "lg:px-0" : ""}`}>
          <div className={rail ? "lg:flex lg:justify-center" : ""}>
            <span className={rail ? "hidden lg:block" : "hidden"}><ThemeSwitch compact /></span>
            <span className={rail ? "lg:hidden" : ""}><ThemeSwitch /></span>
          </div>
          <p className={`px-2 font-mono text-[10px] tracking-[0.12em] text-ink-muted ${rail ? "lg:px-0 lg:text-center" : ""}`}>
            <span className={rail ? "lg:hidden" : ""}>Por: C&amp;I - 2026</span>
            {rail && <span className="hidden lg:inline">C&amp;I</span>}
          </p>
        </div>
        </div>
      </aside>
    </>
  );
}
