// Enrutado de la app con sesión (PR G5).
import { useEffect, type ReactNode } from "react";
import { navigate, routeFromPath, usePath } from "./app/router";
import { AppShell } from "./components/layout/AppShell";
import { CyberBackground, SkeletonCard, ToastProvider } from "./components/ui";
import { SessionProvider, useSession } from "./hooks/useSession";
import { AnalyzerPage } from "./pages/Analyzer";
import { AssistantPage } from "./pages/Assistant";
import { AuditLogPage } from "./pages/AuditLog";
import { DashboardPage } from "./pages/Dashboard";
import { LoginPage } from "./pages/Login";
import { MailboxPage } from "./pages/Mailbox";
import { SupportPage } from "./pages/Support";
import { TimelineQa } from "./pages/TimelineQa"; // MÓDULO ELIMINABLE

export function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <CyberBackground />
        <Routes />
      </ToastProvider>
    </SessionProvider>
  );
}

function Routes() {
  const path = usePath();
  const route = routeFromPath(path);
  const { user, loading } = useSession();

  // Páginas públicas, sin sesión
  if (route === "timeline-qa") return <TimelineQa />; // MÓDULO ELIMINABLE

  if (loading) return <div className="mx-auto max-w-xl p-8"><SkeletonCard /></div>;
  if (!user) return <Redirect to="login" when={route !== "login"}><LoginPage onDone={() => navigate("panel", true)} /></Redirect>;
  if (route === "login" || route === null) return <Redirect to="panel" when />;

  return (
    <AppShell active={route}>
      {route === "buzon" && <MailboxPage />}
      {route === "asistente" && <AssistantPage />}
      {route === "panel" && <DashboardPage />}
      {route === "analizar" && <AnalyzerPage />}
      {route === "bitacora" && <AuditLogPage />}
      {route === "soporte" && <SupportPage />}
    </AppShell>
  );
}

function Redirect({ to, when, children = null }: { to: "login" | "panel"; when: boolean; children?: ReactNode }) {
  useEffect(() => { if (when) navigate(to, true); }, [to, when]);
  return <>{children}</>;
}
