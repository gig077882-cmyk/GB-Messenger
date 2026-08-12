PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_messages_expiry_live ON messages(expires_at) WHERE expired_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
