// Envoltura temporal del Asistente con menú y barra superior (hasta que G5 traiga el enrutado y la sesión real).
import { useState } from "react";
import { PageTransition, Sidebar, Topbar, ToastProvider } from "../components/ui";
import { AssistantPage } from "./Assistant";

export function AssistantPreview() {
  const [open, setOpen] = useState(false);
  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar active="asistente" role="ANALYST" userName="Javier Ríos" open={open} onClose={() => setOpen(false)} onNavigate={() => undefined} onLogout={() => undefined} />
        <div className="min-w-0 flex-1">
          <Topbar title="Asistente IA" subtitle="Consultas de seguridad con guardián ético y datos protegidos" aiStatus="ONLINE" user={{ display_name: "Javier Ríos", role: "ANALYST" }} onMenu={() => setOpen(true)} />
          <PageTransition className="p-4 sm:p-6">
            <AssistantPage />
          </PageTransition>
        </div>
      </div>
    </ToastProvider>
  );
}
