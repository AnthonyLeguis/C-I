-- C&I · G7: acciones del prototipo (escalar a CISO y lista corporativa de dominios bloqueados).
-- SQLite no permite modificar un CHECK: se reconstruye la tabla emails agregando el estado 'ESCALATED'.
CREATE TABLE emails_new (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  from_address TEXT NOT NULL,
  from_name TEXT,
  reply_to TEXT,
  subject TEXT NOT NULL,
  body_sanitized TEXT NOT NULL,
  received_at TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'INBOX' CHECK (folder IN ('INBOX','SPAM','QUARANTINE')),
  risk_level TEXT CHECK (risk_level IN ('SAFE','LOW','HIGH','CRITICAL')),
  risk_score INTEGER,
  indicators TEXT NOT NULL DEFAULT '[]',
  legal_basis TEXT NOT NULL DEFAULT '[]',
  xai_explanation TEXT,
  review_status TEXT NOT NULL DEFAULT 'N/A' CHECK (review_status IN ('N/A','PENDING','CONFIRMED','RESTORED','ESCALATED'))
);
INSERT INTO emails_new SELECT * FROM emails;
DROP TABLE emails;
ALTER TABLE emails_new RENAME TO emails;
CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder, received_at DESC);

CREATE TABLE IF NOT EXISTS blocked_domains (
  domain TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  blocked_by TEXT NOT NULL,
  email_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
