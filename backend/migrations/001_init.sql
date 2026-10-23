-- MiniLedger schema
-- PostgreSQL stores money as NUMERIC so totals stay exact (not floating-point).

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_phone ON otp_challenges (phone);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_phone_active
  ON otp_challenges (phone)
  WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  friend_name TEXT NOT NULL CHECK (char_length(btrim(friend_name)) >= 2),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'repaid')),
  repaid_at TIMESTAMPTZ,
  receipt_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT loans_repaid_timestamp_chk CHECK (
    (status = 'active' AND repaid_at IS NULL)
    OR (status = 'repaid' AND repaid_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans (user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_status ON loans (user_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_user_due_date ON loans (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_loans_friend_name ON loans (user_id, friend_name);
