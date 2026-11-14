// Dueño: Anthony. Archivo compartido: solo lo modifica el Líder.
import { Hono } from "hono";
import type { AppEnv } from "./env";
import { authRoutes } from "./presentation/authRoutes";
import { mailRoutes } from "./presentation/mailRoutes";
import { mailboxRoutes } from "./presentation/mailboxRoutes";
import { dashboardRoutes } from "./presentation/dashboardRoutes";
import { assistantRoutes } from "./presentation/assistantRoutes";
import { auditRoutes } from "./presentation/auditRoutes";
import { domainRoutes } from "./presentation/domainRoutes";
import { supportRoutes } from "./presentation/supportRoutes";
import { timelineQaRoutes } from "./presentation/timelineQaRoutes"; // MÓDULO ELIMINABLE
import { bodySizeLimit, csrfGuard, rateLimit, securityHeaders } from "./presentation/security";

const app = new Hono<AppEnv>().basePath("/api/v1");

// Endurecimiento (auditoría de seguridad QA): cabeceras, CSRF, tamaño máximo y límite de intentos.
app.use("*", securityHeaders);
app.use("*", bodySizeLimit(64 * 1024));
app.use("*", csrfGuard);
app.use("/auth/login", rateLimit("login-ip", 20, 15 * 60));
app.use("/auth/quick-login", rateLimit("quick-login", 30, 5 * 60));
app.use("/mail/analyze", rateLimit("analyze", 30, 60));
app.use("/assistant/ask", rateLimit("ask", 20, 60));
app.use("/mailbox/deliver", rateLimit("deliver", 30, 60));
app.use("/support/reset-demo", rateLimit("reset-demo", 5, 5 * 60));

app.get("/health", (c) => c.json({ status: "ok", service: "C&I", version: "0.1.0" }));
app.route("/auth", authRoutes);
app.route("/mail", mailRoutes);
app.route("/mailbox", mailboxRoutes);
app.route("/dashboard", dashboardRoutes);
app.route("/assistant", assistantRoutes);
app.route("/audit", auditRoutes);
app.route("/domains", domainRoutes);
app.route("/support", supportRoutes);
app.route("/timeline-qa", timelineQaRoutes); // MÓDULO ELIMINABLE

app.notFound((c) => c.json({ error: "Ruta no encontrada." }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Error interno. Intente de nuevo." }, 500);
});

export default app;
