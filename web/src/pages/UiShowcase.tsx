// Página /ui: muestra del kit de componentes en su layout real (PR X2 · criterio de aceptación).
import { useState } from "react";
import { PageTransition, Sidebar, Topbar, ToastProvider, type NavKey } from "../components/ui";
import { BadgeSamples, ButtonSamples, KpiSamples, MeterSamples, StateSamples } from "./UiSamples";

export function UiShowcase() {
  const [active, setActive] = useState<NavKey>("panel");
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar active={active} role="ADMIN" pendingCount={5} open={open} collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} onClose={() => setOpen(false)} onNavigate={setActive} />
        <div className="min-w-0 flex-1">
          <Topbar
            title="Kit de componentes C&I"
            subtitle="X2 · tokens, badges, medidor, KPI, estados, avisos y movimiento"
            user={{ display_name: "Carlos Mendoza", role: "ADMIN" }}
            onMenu={() => setOpen(true)}
          />
          <PageTransition key={active} className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
            <KpiSamples />
            <div className="grid gap-6 xl:grid-cols-2">
              <BadgeSamples />
              <MeterSamples />
            </div>
            <ButtonSamples />
            <StateSamples />
          </PageTransition>
        </div>
      </div>
    </ToastProvider>
  );
}
