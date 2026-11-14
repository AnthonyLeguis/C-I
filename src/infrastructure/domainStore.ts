// [CAPA 3 — INFRAESTRUCTURA] Lista corporativa de dominios bloqueados en D1 (PR G7).
import type { BlockedDomain, DomainStorePort } from "../application/actions";

export function domainStoreFor(db: D1Database): DomainStorePort {
  return {
    async list() {
      const r = await db.prepare("SELECT domain, reason, blocked_by, email_id, created_at FROM blocked_domains ORDER BY created_at DESC").all<BlockedDomain>();
      return r.results ?? [];
    },
    async isBlocked(domain) {
      return (await db.prepare("SELECT 1 AS x FROM blocked_domains WHERE domain = ?").bind(domain).first()) !== null;
    },
    async add(d) {
      await db.prepare("INSERT INTO blocked_domains (domain, reason, blocked_by, email_id) VALUES (?, ?, ?, ?)").bind(d.domain, d.reason, d.blocked_by, d.email_id).run();
    },
    async remove(domain) {
      const r = await db.prepare("DELETE FROM blocked_domains WHERE domain = ?").bind(domain).run();
      return (r.meta?.changes ?? 0) > 0;
    },
  };
}
