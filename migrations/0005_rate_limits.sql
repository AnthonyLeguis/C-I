-- Límite de intentos (auditoría de seguridad QA, 14/11): login, IA y acciones costosas.
-- Ventana fija por clave (p. ej. "login:<ip>:<usuario>"); el conteo se hace con un UPSERT atómico.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
