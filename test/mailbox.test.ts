// PR G3 · Buzón: simular llegada, carpetas automáticas, revisión humana y bitácora.
import { describe, expect, it } from "vitest";
import { DEMO_SCENARIOS, findScenario } from "../src/application/demoScenarios";
import { rulesOnlyAnalyzer } from "../src/application/interimAnalyzer";
import { deliverEmail, listMailbox, reviewEmail, type MailboxEmail, type MailboxStorePort } from "../src/application/mailbox";
import type { AuditEventInput, AuditRepositoryPort } from "../src/domain/ports";
import { sanitizePii } from "../src/infrastructure/piiSanitizer";

function memoryStore(): MailboxStorePort & { rows: MailboxEmail[] } {
  const rows: MailboxEmail[] = [];
  return {
    rows,
    async findByFolder(f) { return rows.filter((r) => r.folder === f); },
    async findById(id) { return rows.find((r) => r.id === id) ?? null; },
    async insert(e) { rows.push(e); },
    async updateFolder(id, f, r) { const e = rows.find((x) => x.id === id); if (e) { e.folder = f; e.reviewStatus = r; } },
  };
}
function memoryAudit(): AuditRepositoryPort & { events: AuditEventInput[] } {
  const events: AuditEventInput[] = [];
  return { events, async append(e) { events.push(e); return { id: String(events.length), hash: `h${events.length}` }; } };
}
let n = 0;
const deps = (store = memoryStore(), audit = memoryAudit()) => ({
  store, audit, analyze: rulesOnlyAnalyzer, sanitize: (t: string) => sanitizePii(t).sanitized,
  newId: () => `id-${++n}`, now: () => new Date("2026-11-14T10:00:00Z"),
});

describe("escenarios de demo", () => {
  it("hay 6 escenarios con id único", () => {
    expect(new Set(DEMO_SCENARIOS.map((s) => s.id)).size).toBe(6);
  });
  it.each([
    ["sudeban-credenciales", "QUARANTINE"],
    ["fraude-ceo", "QUARANTINE"],
    ["tarjeta-acortador", "SPAM"],
    ["rrhh-legitimo", "INBOX"],
    ["conciliacion-legitima", "INBOX"],
  ])("%s cae en %s", async (id, folder) => {
    const s = findScenario(id);
    expect(s).not.toBeNull();
    const v = await rulesOnlyAnalyzer(s!.email);
    expect(v.folder).toBe(folder);
  });
  it("el falso SUDEBAN trae fundamento legal y requiere revisión humana", async () => {
    const v = await rulesOnlyAnalyzer(findScenario("sudeban-credenciales")!.email);
    expect(v.riskLevel).toBe("CRITICAL");
    expect(v.legalBasis.length).toBeGreaterThan(0);
    expect(v.humanReviewRequired).toBe(true);
  });
});

describe("caso de uso del buzón (G3)", () => {
  it("simular llegada: guarda en su carpeta, queda pendiente y se registra en bitácora", async () => {
    const d = deps();
    const r = await deliverEmail(findScenario("sudeban-credenciales")!.email, d);
    expect(r.verdict.folder).toBe("QUARANTINE");
    expect(d.store.rows[0]?.reviewStatus).toBe("PENDING");
    expect(d.audit.events[0]?.module).toBe("MAIL_ANALYZER");
    expect(r.audit_hash).toBe("h1");
  });

  it("listar: contadores por carpeta, pendientes y vistas", async () => {
    const d = deps();
    for (const id of ["sudeban-credenciales", "fraude-ceo", "rrhh-legitimo"]) await deliverEmail(findScenario(id)!.email, d);
    const all = await listMailbox("ALL", d.store);
    expect(all.total).toBe(3);
    expect(all.counts).toEqual({ INBOX: 1, SPAM: 0, QUARANTINE: 2 });
    expect(all.pending).toBe(2);
    expect((await listMailbox("PENDING", d.store)).emails).toHaveLength(2);
    expect((await listMailbox("INBOX", d.store)).emails).toHaveLength(1);
  });

  it("revisión: confirmar deja en cuarentena; restaurar devuelve a bandeja; ambas en bitácora", async () => {
    const d = deps();
    const a = await deliverEmail(findScenario("sudeban-credenciales")!.email, d);
    const b = await deliverEmail(findScenario("fraude-ceo")!.email, d);
    const c1 = await reviewEmail(a.email_id, "CONFIRM", "Dra. Sofía Valenzuela", d);
    const c2 = await reviewEmail(b.email_id, "RESTORE", "Dra. Sofía Valenzuela", d);
    expect(c1).toMatchObject({ review_status: "CONFIRMED", folder: "QUARANTINE" });
    expect(c2).toMatchObject({ review_status: "RESTORED", folder: "INBOX" });
    expect(d.audit.events.filter((e) => e.module === "REVIEW").map((e) => e.actor)).toEqual(["Dra. Sofía Valenzuela", "Dra. Sofía Valenzuela"]);
  });

  it("revisar un correo inexistente devuelve null", async () => {
    expect(await reviewEmail("no-existe", "CONFIRM", "x", deps())).toBeNull();
  });
});
