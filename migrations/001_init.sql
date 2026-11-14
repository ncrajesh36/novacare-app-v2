CREATE TABLE IF NOT EXISTS app_state (
  user_id TEXT PRIMARY KEY,
  reminders JSONB NOT NULL DEFAULT '[]'::jsonb,
  alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 84.50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL DEFAULT 'rosa',
  role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_created_idx
  ON chat_messages (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS captures (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  systolic INT NOT NULL,
  diastolic INT NOT NULL,
  source TEXT NOT NULL DEFAULT 'demo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS captures_user_created_idx
  ON captures (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  symptoms TEXT,
  doctor TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
