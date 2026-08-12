PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL COLLATE NOCASE UNIQUE, password_hash TEXT NOT NULL,
 display_name TEXT NOT NULL, avatar_url TEXT, bio TEXT, role TEXT NOT NULL CHECK(role IN ('owner','admin','member')),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')), last_seen_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS invites (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK(role IN ('admin','member')),
 created_by TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL, used_by TEXT REFERENCES users(id), used_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS refresh_tokens (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chats (
 id TEXT PRIMARY KEY, type TEXT NOT NULL CHECK(type IN ('direct','group')), title TEXT, created_by TEXT NOT NULL REFERENCES users(id),
 direct_key TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chat_members (
 chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 member_role TEXT NOT NULL DEFAULT 'member' CHECK(member_role IN ('owner','admin','member')),
 joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, left_at TEXT, archived_at TEXT, pinned_at TEXT, last_read_message_id TEXT,
 PRIMARY KEY(chat_id,user_id)
);
CREATE TABLE IF NOT EXISTS messages (
 id TEXT PRIMARY KEY, chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE, sender_id TEXT NOT NULL REFERENCES users(id),
 kind TEXT NOT NULL CHECK(kind IN ('text','system','file')), text TEXT, file_id TEXT,
 reply_to_id TEXT REFERENCES messages(id), forwarded_from_id TEXT REFERENCES messages(id),
 deleted_for_everyone_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, edited_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id,created_at,id);
CREATE VIRTUAL TABLE IF NOT EXISTS message_search USING fts5(message_id UNINDEXED, chat_id UNINDEXED, text, tokenize='unicode61');
CREATE TRIGGER IF NOT EXISTS msg_ai AFTER INSERT ON messages WHEN NEW.text IS NOT NULL BEGIN INSERT INTO message_search VALUES(NEW.id,NEW.chat_id,NEW.text); END;
CREATE TRIGGER IF NOT EXISTS msg_au AFTER UPDATE OF text ON messages BEGIN DELETE FROM message_search WHERE message_id=OLD.id; INSERT INTO message_search SELECT NEW.id,NEW.chat_id,NEW.text WHERE NEW.text IS NOT NULL; END;
CREATE TABLE IF NOT EXISTS reactions (
 message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 emoji TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(message_id,user_id,emoji)
);
CREATE TABLE IF NOT EXISTS message_receipts (
 message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 delivered_at TEXT, read_at TEXT, PRIMARY KEY(message_id,user_id)
);
CREATE TABLE IF NOT EXISTS message_deletions (
 message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(message_id,user_id)
);
CREATE TABLE IF NOT EXISTS uploads (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), original_name TEXT NOT NULL, mime_type TEXT NOT NULL,
 size_bytes INTEGER NOT NULL, chunk_size INTEGER NOT NULL, expected_sha256 TEXT NOT NULL, actual_sha256 TEXT,
 status TEXT NOT NULL CHECK(status IN ('uploading','assembling','ready','failed','expired')),
 storage_path TEXT, expires_at TEXT NOT NULL, completed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS upload_chunks (
 upload_id TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE, chunk_index INTEGER NOT NULL, size_bytes INTEGER NOT NULL,
 sha256 TEXT NOT NULL, storage_path TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(upload_id,chunk_index)
);
CREATE TABLE IF NOT EXISTS download_confirmations (
 upload_id TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id),
 confirmed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(upload_id,user_id)
);
CREATE TABLE IF NOT EXISTS calls (
 id TEXT PRIMARY KEY, chat_id TEXT NOT NULL REFERENCES chats(id), started_by TEXT NOT NULL REFERENCES users(id),
 status TEXT NOT NULL CHECK(status IN ('ringing','active','ended')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, ended_at TEXT
);
CREATE TABLE IF NOT EXISTS call_participants (
 call_id TEXT NOT NULL REFERENCES calls(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id),
 joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, left_at TEXT, PRIMARY KEY(call_id,user_id)
);
