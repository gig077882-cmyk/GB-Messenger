// ─── API Types (mirroring backend contract) ───────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: 'owner' | 'admin' | 'member';
  lastSeenAt: string | null;
  createdAt: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  direct_key: string | null;
  created_by: string;
  updated_at: string;
  created_at: string;
  archived_at: string | null;
  pinned_at: string | null;
  members?: Array<{ id?: string; user_id?: string; role?: string; displayName?: string }>;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  kind: 'text' | 'system' | 'file';
  text: string | null;
  file_id: string | null;
  reply_to_id: string | null;
  forwarded_from_id: string | null;
  deleted_for_everyone_at: string | null;
  created_at: string;
  updated_at: string;
  pinned?: boolean;
  delivered?: boolean;
  read?: boolean;
  poll?: Record<string, unknown>;
  members?: Array<{ id?: string; user_id?: string; role?: string }>;
}

export interface Reaction {
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface Upload {
  id: string;
  owner_id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  chunk_size: number;
  expected_sha256: string;
  status: 'uploading' | 'assembling' | 'ready' | 'error';
  expires_at: string;
  created_at: string;
  chunks?: UploadChunk[];
}

export interface UploadChunk {
  chunk_index: number;
  size_bytes: number;
  sha256: string;
}

export interface Call {
  id: string;
  chat_id: string;
  created_by: string;
  status: 'ringing' | 'active' | 'ended';
  created_at: string;
}

export interface Invite {
  inviteToken: string;
  role: 'admin' | 'member';
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export type WsEvent =
  | { type: 'session.ready'; userId: string }
  | { type: 'presence.online'; userId: string }
  | { type: 'presence.offline'; userId: string }
  | { type: 'message.created'; chatId: string; message: Message }
  | { type: 'message.edited'; chatId: string; messageId: string }
  | { type: 'message.pinned'; chatId: string; messageId: string }
  | { type: 'message.unpinned'; chatId: string; messageId: string }
  | { type: 'message.deleted'; messageId: string; scope: 'me' | 'everyone' }
  | { type: 'message.delivered'; messageId: string; userId: string }
  | { type: 'message.read'; messageId: string; userId: string }
  | { type: 'reaction.updated'; messageId: string; userId: string; emoji: string; active: boolean }
  | { type: 'chat.member_added'; chatId: string; userId: string }
  | { type: 'chat.member_removed'; chatId: string; userId: string }
  | { type: 'chat.disappearing_updated'; chatId: string; seconds: number | null }
  | { type: 'poll.created'; chatId: string; poll: Record<string, unknown> }
  | { type: 'poll.updated'; chatId: string; pollId: string; results: Array<{ id: string; text: string; votes: number }> }
  | { type: 'user.blocked'; byUserId: string }
  | { type: 'typing.start'; chatId: string; userId: string }
  | { type: 'typing.stop'; chatId: string; userId: string }
  | { type: 'call.ringing'; callId: string; chatId: string; callerId: string }
  | { type: 'call.joined'; callId: string; userId: string }
  | { type: 'call.left'; callId: string; userId: string }
  | { type: 'webrtc.offer'; callId: string; fromUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'webrtc.answer'; callId: string; fromUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'webrtc.ice'; callId: string; fromUserId: string; candidate: RTCIceCandidateInit };
