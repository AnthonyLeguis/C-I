-- C&I · A6: ajustes del sistema (modo del motor de IA) para la Consola de Soporte.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT OR IGNORE INTO settings (key, value, updated_by) VALUES ('ai_mode', 'ONLINE', 'SYSTEM');
