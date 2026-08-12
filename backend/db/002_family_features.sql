PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN privacy_online TEXT NOT NULL DEFAULT 'contacts' CHECK(privacy_online IN ('everyone','contacts','nobody'));
ALTER TABLE users ADD COLUMN privacy_last_seen TEXT NOT NULL DEFAULT 'contacts' CHECK(privacy_last_seen IN ('everyone','contacts','nobody'));
ALTER TABLE users ADD COLUMN privacy_avatar TEXT NOT NULL DEFAULT 'everyone' CHECK(privacy_avatar IN ('everyone','contacts','nobody'));
ALTER TABLE users ADD COLUMN privacy_status TEXT NOT NULL DEFAULT 'contacts' CHECK(privacy_status IN ('everyone','contacts','nobody'));
ALTER TABLE users ADD COLUMN privacy_read_receipts INTEGER NOT NULL DEFAULT 1 CHECK(privacy_read_receipts IN (0,1));

ALTER TABLE chats ADD COLUMN admins_only INTEGER NOT NULL DEFAULT 0 CHECK(admins_only IN (0,1));
ALTER TABLE chats ADD COLUMN disappearing_seconds INTEGER CHECK(disappearing_seconds IS NULL OR disappearing_seconds BETWEEN 60 AND 2592000);
ALTER TABLE chat_members ADD COLUMN muted_until TEXT;
ALTER TABLE chat_members ADD COLUMN muted_forever INTEGER NOT NULL DEFAULT 0 CHECK(muted_forever IN (0,1));

ALTER TABLE messages ADD COLUMN edited_by TEXT REFERENCES users(id);
ALTER TABLE messages ADD COLUMN edit_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN expires_at TEXT;
ALTER TABLE messages ADD COLUMN expired_at TEXT;
ALTER TABLE messages ADD COLUMN external_url TEXT;
ALTER TABLE messages ADD COLUMN asset_ref TEXT;

CREATE TABLE IF NOT EXISTS message_mentions (
 message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token TEXT NOT NULL,
 PRIMARY KEY(message_id,user_id)
);
CREATE TABLE IF NOT EXISTS message_pins (
 chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
 message_id TEXT NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
 pinned_by TEXT NOT NULL REFERENCES users(id),
 pinned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(chat_id,message_id)
);
CREATE TABLE IF NOT EXISTS user_blocks (
 blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(blocker_id <> blocked_id),
 PRIMARY KEY(blocker_id,blocked_id)
);
CREATE TABLE IF NOT EXISTS polls (
 id TEXT PRIMARY KEY,
 message_id TEXT NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
 question TEXT NOT NULL,
 multiple_choice INTEGER NOT NULL DEFAULT 0 CHECK(multiple_choice IN (0,1)),
 closes_at TEXT,
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS poll_options (
 id TEXT PRIMARY KEY,
 poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
 position INTEGER NOT NULL,
 text TEXT NOT NULL,
 UNIQUE(poll_id,position)
);
CREATE TABLE IF NOT EXISTS poll_votes (
 poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
 option_id TEXT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(poll_id,option_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_messages_expiry ON messages(expires_at) WHERE expired_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blocks_pair ON user_blocks(blocked_id,blocker_id);

ALTER TABLE calls ADD COLUMN reconnect_grace_until TEXT;
ALTER TABLE call_participants ADD COLUMN reconnect_until TEXT;
ALTER TABLE call_participants ADD COLUMN screen_share_enabled INTEGER NOT NULL DEFAULT 0 CHECK(screen_share_enabled IN (0,1));
