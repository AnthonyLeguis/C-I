// Menú lateral (PR X2): azul del logo, fijo en escritorio y deslizable en móvil (PLAN_UX §1.1).
import { LogOut, ScrollText, ScanSearch, LayoutDashboard, Mail, MessageSquareText, Wrench, type LucideIcon } from "lucide-react";
import type { Role } from "../../types/contracts";
import { ROLE_LABEL } from "./levels";

export type NavKey = "panel" | "buzon" | "analizar" | "asistente" | "bitacora" | "soporte";
interface NavItem { key: NavKey; label: string; icon: LucideIcon; minRole: Role }

export const NAV: NavItem[] = [
  { key: "panel", label: "Panel Principal", icon: LayoutDashboard, minRole: "ANALYST" },
  { key: "buzon", label: "Buzón de Alertas", icon: Mail, minRole: "ANALYST" },
  { key: "analizar", label: "Analizador de Casos", icon: ScanSearch, minRole: "ANALYST" },
  { key: "asistente", label: "Asistente IA", icon: MessageSquareText, minRole: "ANALYST" },
  { key: "bitacora", label: "Bitácora de Eventos", icon: ScrollText, minRole: "SUPERVISOR" },
  { key: "soporte", label: "Consola de Soporte", icon: Wrench, minRole: "ADMIN" },
];
const RANK: Record<Role, number> = { ANALYST: 1, SUPERVISOR: 2, ADMIN: 3 };

export interface SidebarProps {
  active: NavKey;
  role: Role;
  userName: string;
  pendingCount?: number;
  open: boolean;
  onClose: () => void;
  onNavigate: (key: NavKey) => void;
  onLogout: () => void;
}

export function Sidebar({ active, role, userName, pendingCount = 0, open, onClose, onNavigate, onLogout }: SidebarProps) {
  const items = NAV.filter((n) => RANK[role] >= RANK[n.minRole]); // lo que el rol no permite, no se muestra
  return (
    <>
      <div onClick={onClose} aria-hidden className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar text-sidebar-ink transition-transform duration-[240ms] ease-[cubic-bezier(.16,1,.3,1)] lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Navegación principal"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-control bg-white/10 text-sm font-bold">C&amp;I</span>
          <div>
            <p className="font-bold leading-tight text-white">Sistema C&amp;I</p>
            <p className="font-mono text-[10px] tracking-[0.18em] text-sidebar-ink/70">DEFENSA BANCARIA</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map(({ key, label, icon: Icon }) => {
            const isActive = key === active;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { onNavigate(key); onClose(); }}
                aria-current={isActive ? "page" : undefined}
                className={`press flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-sidebar-active text-white shadow-[inset_3px_0_0_var(--ai)]" : "text-sidebar-ink/85 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={18} aria-hidden />
                <span className="flex-1 text-left">{label}</span>
                {key === "buzon" && pendingCount > 0 && <span className="rounded-badge bg-white/90 px-1.5 text-xs font-bold text-sidebar">{pendingCount}</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="text-sm font-semibold text-white">{userName}</p>
          <p className="font-mono text-[11px] text-ai">{ROLE_LABEL[role]}</p>
          <button type="button" onClick={onLogout} className="press mt-3 flex w-full items-center justify-center gap-2 rounded-control border border-white/15 bg-white/5 py-2 text-sm font-semibold text-white hover:bg-white/10">
            <LogOut size={16} aria-hidden /> Cambiar perfil
          </button>
        </div>
      </aside>
    </>
  );
}
