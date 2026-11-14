// [CAPA 3 — INFRAESTRUCTURA] Ajustes y reinicio de la demo en D1 (PR A6).
import seedSql from "../../seed/seed_mailbox.sql";
import { OPERATION_MODES, type OperationMode, type SupportStorePort } from "../application/support";
import { DEMO_RECIPIENT } from "../application/mailbox";

/** Sentencias INSERT del seed (W5), una por correo, sin comentarios. */
export function seedStatements(sql: string = seedSql): string[] {
  return sql
    .split(/(?=INSERT INTO emails)/)
    .filter((chunk) => chunk.startsWith("INSERT INTO emails"))
    .map((chunk) => chunk.replace(/\n--[^\n]*/g, "").trim());
}

/** Lee el modo; si la tabla aún no existe (migración pendiente) se asume ONLINE. */
export async function readMode(db: D1Database | undefined): Promise<OperationMode> {
  if (!db) return "ONLINE";
  try {
    const row = await db.prepare("SELECT value FROM app_settings WHERE key = 'mode'").first<{ value: string }>();
    return OPERATION_MODES.includes(row?.value as OperationMode) ? (row?.value as OperationMode) : "ONLINE";
  } catch {
    return "ONLINE";
  }
}

export function supportStoreFor(db: D1Database): SupportStorePort {
  const count = async (table: string) => (await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>())?.n ?? 0;
  return {
    getMode: () => readMode(db),
    async setMode(mode) {
      await db
        .prepare("INSERT INTO app_settings (key, value, updated_at) VALUES ('mode', ?, strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
        .bind(mode)
        .run();
    },
    async counts() {
      return { emails: await count("emails"), audit_events: await count("audit_events"), blocked_domains: await count("blocked_domains") };
    },
    async restoreSeed() {
      const inserts = seedStatements();
      await db.batch([
        db.prepare("DELETE FROM emails WHERE recipient = ?").bind(DEMO_RECIPIENT),
        db.prepare("DELETE FROM blocked_domains"),
        ...inserts.map((s) => db.prepare(s)),
      ]);
      return inserts.length;
    },
  };
}
