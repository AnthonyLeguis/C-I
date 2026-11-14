-- C&I · Esquema inicial (Anthony, A0). Ver C&I.md §5.1
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','SUPERVISOR','ANALYST')),
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS emails (
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
  review_status TEXT NOT NULL DEFAULT 'N/A' CHECK (review_status IN ('N/A','PENDING','CONFIRMED','RESTORED'))
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL CHECK (module IN ('MAIL_ANALYZER','ASSISTANT_GUARD','REVIEW','AUTH')),
  email_id TEXT,
  actor TEXT NOT NULL,
  risk_level TEXT,
  risk_score INTEGER,
  action_taken TEXT NOT NULL,
  indicators TEXT NOT NULL DEFAULT '[]',
  legal_basis TEXT NOT NULL DEFAULT '[]',
  pii_detected TEXT NOT NULL DEFAULT '[]',
  xai_explanation TEXT,
  ai_used INTEGER NOT NULL DEFAULT 0,
  ai_model TEXT,
  prev_hash TEXT,
  hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at DESC);
