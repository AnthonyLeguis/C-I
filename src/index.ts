// Dueño: Anthony. Archivo compartido: solo lo modifica el Líder.
import { Hono } from "hono";
import type { AppEnv } from "./env";
import { authRoutes } from "./presentation/authRoutes";
import { mailRoutes } from "./presentation/mailRoutes";
import { mailboxRoutes } from "./presentation/mailboxRoutes";
import { dashboardRoutes } from "./presentation/dashboardRoutes";
import { assistantRoutes } from "./presentation/assistantRoutes";
import { auditRoutes } from "./presentation/auditRoutes";

const app = new Hono<AppEnv>().basePath("/api/v1");

app.get("/health", (c) => c.json({ status: "ok", service: "C&I", version: "0.1.0" }));
app.route("/auth", authRoutes);
app.route("/mail", mailRoutes);
app.route("/mailbox", mailboxRoutes);
app.route("/dashboard", dashboardRoutes);
app.route("/assistant", assistantRoutes);
app.route("/audit", auditRoutes);

app.notFound((c) => c.json({ error: "Ruta no encontrada." }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Error interno. Intente de nuevo." }, 500);
});

export default app;
