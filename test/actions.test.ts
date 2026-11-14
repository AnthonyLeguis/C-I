// PR G7 · Acciones del prototipo: marcar seguro, escalar a CISO, bloquear dominios y CSV de la bitácora.
import { describe, expect, it } from "vitest";
import { approveEmail, blockDomain, escalateEmail, normalizeDomainInput, toCsv, unblockDomain, type BlockedDomain, type DomainStorePort } from "../src/application/actions";
import { findScenario } from "../src/application/demoScenarios";
import { rulesOnlyAnalyzer } from "../src/application/interimAnalyzer";
import { deliverEmail, type MailboxEmail, type MailboxStorePort } from "../src/application/mailbox";
import type { AuditEventInput, AuditRepositoryPort } from "../src/domain/ports";

const store = (): MailboxStorePort & { rows: MailboxEmail[] } => {
  const rows: MailboxEmail[] = [];
  return {
    rows,
    async findByFolder(f) { return rows.filter((r) => r.folder === f); },
    async findById(id) { return rows.find((r) => r.id === id) ?? null; },
    async insert(e) { rows.push(e); },
    async updateFolder(id, f, r) { const e = rows.find((x) => x.id === id); if (e) { e.folder = f; e.reviewStatus = r; } },
  };
};
const audit = (): AuditRepositoryPort & { events: AuditEventInput[] } => {
  const events: AuditEventInput[] = [];
  return { events, async append(e) { events.push(e); return { id: String(events.length), hash: `h${events.length}` }; } };
};
const domains = (): DomainStorePort & { rows: BlockedDomain[] } => {
  const rows: BlockedDomain[] = [];
  return {
    rows,
    async list() { return rows; },
    async isBlocked(d) { return rows.some((r) => r.domain === d); },
    async add(d) { rows.push({ ...d, created_at: "2026-11-14T10:00:00Z" }); },
    async remove(d) { const i = rows.findIndex((r) => r.domain === d); if (i < 0) return false; rows.splice(i, 1); return true; },
  };
};
let n = 0;
const deliverDeps = (s = store(), a = audit()) => ({ store: s, audit: a, analyze: rulesOnlyAnalyzer, sanitize: (t: string) => t, newId: () => `m${++n}`, now: () => new Date("2026-11-14T10:00:00Z") });

describe("marcar seguro y escalar (G7)", () => {
  it("aprobar: vuelve a la bandeja como restaurado y queda en bitácora", async () => {
    const d = deliverDeps();
    const r0 = await deliverEmail(findScenario("tarjeta-acortador")!.email, d);
    const r = await approveEmail(r0.email_id, "Javier Ríos", d);
    expect(r).toMatchObject({ folder: "INBOX", review_status: "RESTORED" });
    expect(d.audit.events.at(-1)).toMatchObject({ module: "REVIEW", actor: "Javier Ríos", actionTaken: "MARKED_SAFE" });
  });
  it("escalar: conserva la carpeta y marca ESCALATED", async () => {
    const d = deliverDeps();
    const r0 = await deliverEmail(findScenario("fraude-ceo")!.email, d);
    const r = await escalateEmail(r0.email_id, "Javier Ríos", d);
    expect(r).toMatchObject({ folder: "QUARANTINE", review_status: "ESCALATED" });
    expect(d.audit.events.at(-1)?.actionTaken).toBe("ESCALATED_TO_CISO");
  });
  it("correo inexistente → null", async () => {
    expect(await approveEmail("no", "x", deliverDeps())).toBeNull();
    expect(await escalateEmail("no", "x", deliverDeps())).toBeNull();
  });
});

describe("dominios bloqueados (G7)", () => {
  it.each([
    ["notificaciones@SUDEBAN-portal-seguro.com", "sudeban-portal-seguro.com"],
    ["https://bit.ly/abc", "bit.ly"],
    ["seniat-tramites-enlinea.com", "seniat-tramites-enlinea.com"],
    ["no es dominio", null],
  ])("normaliza %s → %s", (raw, out) => expect(normalizeDomainInput(raw)).toBe(out));

  it("bloquear, no duplicar y desbloquear, todo en bitácora", async () => {
    const a = audit(); const ds = domains();
    const r1 = await blockDomain("x@sudeban-portal-seguro.com", "Phishing", "Dra. Sofía Valenzuela", "m1", { audit: a, domains: ds });
    expect(r1).toMatchObject({ ok: true, domain: "sudeban-portal-seguro.com" });
    expect(await blockDomain("sudeban-portal-seguro.com", "x", "y", null, { audit: a, domains: ds })).toMatchObject({ ok: false, conflict: true });
    expect(await unblockDomain("sudeban-portal-seguro.com", "Carlos Mendoza", { audit: a, domains: ds })).toMatchObject({ domain: "sudeban-portal-seguro.com" });
    expect(a.events.map((e) => e.actionTaken)).toEqual(["DOMAIN_BLOCKED", "DOMAIN_UNBLOCKED"]);
  });

  it("un correo de un dominio bloqueado cae directo en cuarentena", async () => {
    const ds = domains();
    await ds.add({ domain: "banco-demo.com.ve", reason: "prueba", blocked_by: "x", email_id: null });
    const d = { ...deliverDeps(), isBlocked: (x: string) => ds.isBlocked(x) };
    const r = await deliverEmail(findScenario("rrhh-legitimo")!.email, d);
    expect(r.verdict.folder).toBe("QUARANTINE");
    expect(r.verdict.indicators[0]?.text).toContain("lista corporativa de bloqueo");
  });
});

describe("CSV de la bitácora (G7)", () => {
  it("usa ; , BOM para Excel y escapa comillas", () => {
    const csv = toCsv([{ a: 'dijo "hola"', b: ["x"], c: null }], ["a", "b", "c"]);
    expect(csv.startsWith("\uFEFFa;b;c\r\n")).toBe(true);
    expect(csv).toContain('"dijo ""hola"""');
    expect(csv).toContain('"[""x""]"');
  });
});
