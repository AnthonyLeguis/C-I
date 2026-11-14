-- MÓDULO ELIMINABLE "timeline-qa": guarda el último cálculo de avance del equipo (una sola fila).
CREATE TABLE IF NOT EXISTS timeline_qa (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
