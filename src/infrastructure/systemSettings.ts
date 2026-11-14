// [CAPA 3 — INFRAESTRUCTURA] Ajustes del sistema en D1 (PR A6): modo del motor de IA.
// "RULES" apaga la IA en todo el sistema (análisis, buzón y asistente) y deja solo el motor de reglas:
// es el Plan B de la demo si Workers AI falla o se agota la cuota.
export type AiMode = "ONLINE" | "RULES";

export async function getAiMode(db: D1Database): Promise<AiMode> {
  try {
    const r = await db.prepare("SELECT value FROM settings WHERE key = 'ai_mode'").first<{ value: string }>();
    return r?.value === "RULES" ? "RULES" : "ONLINE";
  } catch {
    return "ONLINE"; // sin migración 0004: comportamiento normal
  }
}

export async function setAiMode(db: D1Database, mode: AiMode, actor: string): Promise<void> {
  await db.prepare(
    "INSERT INTO settings (key, value, updated_by, updated_at) VALUES ('ai_mode', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at",
  ).bind(mode, actor).run();
}

/** Binding de IA efectivo según el modo: undefined en modo reglas (los adaptadores aplican el respaldo). */
export async function effectiveAi(env: { DB: D1Database; AI?: Ai }): Promise<Ai | undefined> {
  return (await getAiMode(env.DB)) === "RULES" ? undefined : env.AI;
}
