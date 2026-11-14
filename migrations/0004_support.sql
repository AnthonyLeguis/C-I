-- C&I · A6: ajustes de la Consola de Soporte (modo de operación del motor).
-- mode = ONLINE (reglas + IA) | RULES_ONLY (solo motor determinista, sin Workers AI).
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('mode', 'ONLINE');
