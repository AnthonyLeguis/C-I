import { describe, expect, it } from "vitest";
import app from "../src/index";
import { getSupportStatus, resetDemo, setOperationMode, type OperationMode, type SupportStorePort } from "../src/application/support";
import type { AuditEventInput, AuditRepositoryPort } from "../src/domain/ports";
import { signSession, type SessionUser } from "../src/infrastructure/auth";
import { readMode, seedStatements } from "../src/infrastructure/supportStore";

const SECRET = "ci-test-key-321";
const user = (role: SessionUser["role"], username: string): SessionUser => ({ id: `id-${username}`, username, display_name: username, role });
const cookie = async (u: SessionUser) => `session=${await signSession({ user: u, exp: Math.floor(Date.now() / 1000) + 3600 }, SECRET)}`;

function fakeStore(initial: OperationMode = "ONLINE", broken = false) {
  const state = { mode: initial, restored: 0 };
  const store: SupportStorePort = {
    getMode: async () => state.mode,
    setMode: async (m) => { state.mode = m; },
    counts: async () => { if (broken) throw new Error("D1 caída"); return { emails: 20, audit_events: 5, blocked_domains: 1 }; },
    restoreSeed: async () => { state.restored += 1; return 20; },
  };
  return { store, state };
}
function fakeAudit() {
  const events: AuditEventInput[] = [];
  const audit: AuditRepositoryPort = { append: async (e) => { events.push(e); return { id: "e", hash: `h${events.length}` }; } };
  return { audit, events };
}
/** D1 mínimo: solo responde la lectura del modo. */
const modeDb = (mode: string) => ({ prepare: () => ({ first: async () => ({ value: mode }), bind() { return this; } }) }) as unknown as D1Database;

describe("Consola de Soporte (A6)", () => {
  it("el seed se reparte en 20 sentencias INSERT sin comentarios", () => {
    const s = seedStatements();
    expect(s).toHaveLength(20);
    for (const stmt of s) {
      expect(stmt.startsWith("INSERT INTO emails")).toBe(true);
      expect(stmt).not.toMatch(/\n--/);
    }
  });

  it("estado: IA en línea, apagada por modo reglas o no disponible", async () => {
    expect((await getSupportStatus(fakeStore().store, true, "m")).ai).toMatchObject({ active: true, status: "EN_LINEA", model: "m" });
    expect((await getSupportStatus(fakeStore("RULES_ONLY").store, true, "m")).ai).toMatchObject({ active: false, status: "APAGADA", model: null });
    expect((await getSupportStatus(fakeStore().store, false, "m")).ai.status).toBe("NO_DISPONIBLE");
  });

  it("estado: informa si D1 no responde sin lanzar error", async () => {
    expect((await getSupportStatus(fakeStore("ONLINE", true).store, true, "m")).database.ok).toBe(false);
  });

  it("cambiar a modo reglas queda en la bitácora; repetirlo no duplica el evento", async () => {
    const { store, state } = fakeStore();
    const { audit, events } = fakeAudit();
    const r = await setOperationMode("RULES_ONLY", "Carlos", { store, audit });
    expect(r).toMatchObject({ mode: "RULES_ONLY", changed: true });
    expect(state.mode).toBe("RULES_ONLY");
    expect(events[0]?.actionTaken).toBe("SUPPORT_MODE_RULES_ONLY");
    expect((await setOperationMode("RULES_ONLY", "Carlos", { store, audit })).changed).toBe(false);
    expect(events).toHaveLength(1);
  });

  it("restablecer la demo recarga el seed, vuelve a ONLINE y lo registra", async () => {
    const { store, state } = fakeStore("RULES_ONLY");
    const { audit, events } = fakeAudit();
    const r = await resetDemo("Carlos", { store, audit });
    expect(r).toMatchObject({ emails: 20, mode: "ONLINE" });
    expect(state).toMatchObject({ mode: "ONLINE", restored: 1 });
    expect(events[0]?.actionTaken).toBe("SUPPORT_RESET_DEMO");
  });

  it("readMode asume ONLINE si no hay base o el valor es desconocido", async () => {
    expect(await readMode(undefined)).toBe("ONLINE");
    expect(await readMode(modeDb("RULES_ONLY"))).toBe("RULES_ONLY");
    expect(await readMode(modeDb("otra-cosa"))).toBe("ONLINE");
  });

  it("solo el Master (ADMIN) entra: sin sesión 401, CISO 403", async () => {
    const env = { SESSION_SECRET: SECRET } as never;
    expect((await app.request("/api/v1/support/status", {}, env)).status).toBe(401);
    const ciso = await cookie(user("SUPERVISOR", "svalenzuela"));
    for (const [path, method] of [["/status", "GET"], ["/mode", "POST"], ["/reset-demo", "POST"]] as const) {
      const r = await app.request(`/api/v1/support${path}`, { method, headers: { cookie: ciso, "content-type": "application/json" }, body: method === "POST" ? "{}" : undefined }, env);
      expect(r.status).toBe(403);
    }
  });

  it("modo inválido → 400", async () => {
    const env = { SESSION_SECRET: SECRET, DB: modeDb("ONLINE") } as never;
    const r = await app.request("/api/v1/support/mode", { method: "POST", headers: { cookie: await cookie(user("ADMIN", "cmendoza")), "content-type": "application/json" }, body: JSON.stringify({ mode: "APAGADO" }) }, env);
    expect(r.status).toBe(400);
  });

  it("con Workers AI conectado y modo RULES_ONLY, la IA se reporta apagada (interruptor global)", async () => {
    const env = { SESSION_SECRET: SECRET, DB: modeDb("RULES_ONLY"), AI: { run: async () => ({}) } } as never;
    const r = await app.request("/api/v1/support/status", { headers: { cookie: await cookie(user("ADMIN", "cmendoza")) } }, env);
    expect(r.status).toBe(200);
    expect(((await r.json()) as { ai: unknown }).ai).toMatchObject({ bound: true, active: false, status: "APAGADA" });
  });
});
