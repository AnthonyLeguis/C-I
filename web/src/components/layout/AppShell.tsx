// Estructura de la app autenticada: menú lateral, barra superior y contenido (PR G5).
import { useEffect, useState, type ReactNode } from "react";
import { navigate, type RouteKey } from "../../app/router";
import { requestMailboxFocus } from "../../hooks/useMailbox";
import { useSession } from "../../hooks/useSession";
import { api } from "../../services/apiClient";
import type { AiStatus, DashboardResponse } from "../../types/contracts";
import { PageTransition, Sidebar, Topbar, type NavKey } from "../ui";

const TITLES: Record<NavKey, [string, string]> = {
  panel: ["Panel Principal", "Monitoreo ejecutivo de amenazas y triaje prioritario"],
  buzon: ["Buzón de Alertas", "Clasificación de correos entrantes y simulación de incidentes"],
  analizar: ["Analizador de Casos", "Expediente técnico con acciones en 1 clic"],
  asistente: ["Asistente IA", "Consultas de seguridad con guardián ético y datos protegidos"],
  bitacora: ["Bitácora de Eventos", "Registro de auditoría con integridad criptográfica"],
  soporte: ["Consola de Soporte", "Estado del sistema, motor IA y bloqueos corporativos"],
};

const COLLAPSE_KEY = "ci-sidebar-collapsed";
const readCollapsed = (): boolean => { try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; } };

export function AppShell({ active, children }: { active: NavKey; children: ReactNode }) {
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [pending, setPending] = useState(0);
  const [queue, setQueue] = useState<DashboardResponse["review_queue"]>([]);
  const [ai, setAi] = useState<AiStatus>("UNKNOWN");

  useEffect(() => {
    const load = () => api.dashboard().then((d) => { setPending(d.kpis.pending_review); setQueue(d.review_queue); setAi(d.ai_status); }).catch(() => undefined);
    load();
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [active]);

  const toggleCollapsed = () => setCollapsed((c) => {
    try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch { /* sin almacenamiento */ }
    return !c;
  });

  if (!user) return null;
  const [title, subtitle] = TITLES[active];
  return (
    <div className="flex min-h-screen">
      <Sidebar active={active} role={user.role} pendingCount={pending} open={open} collapsed={collapsed} onToggleCollapsed={toggleCollapsed}
        onClose={() => setOpen(false)} onNavigate={(k) => navigate(k as RouteKey)} />
      <div className="min-w-0 flex-1">
        <Topbar title={title} subtitle={subtitle} aiStatus={ai} user={{ display_name: user.display_name, role: user.role }} onMenu={() => setOpen(true)}
          onLogout={() => { void logout().then(() => navigate("login", true)); }}
          pending={{ count: pending, items: queue }}
          onOpenCase={(id) => { if (id) requestMailboxFocus(id); navigate("buzon"); }} />
        <PageTransition key={active} className="p-4 sm:p-6">{children}</PageTransition>
      </div>
    </div>
  );
}
