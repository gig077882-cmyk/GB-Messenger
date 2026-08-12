export type User = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: 'owner' | 'admin' | 'member';
  lastSeenAt: string | null;
  createdAt: string;
};

export type AuthResponse = {user: User; accessToken: string};

export type Chat = {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  direct_key: string | null;
  created_by: string;
  updated_at: string;
  created_at: string;
  archived_at: string | null;
  pinned_at: string | null;
};

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  kind: 'text' | 'system' | 'file' | 'sticker' | 'gif' | 'poll';
  text: string | null;
  file_id: string | null;
  reply_to_id: string | null;
  forwarded_from_id: string | null;
  deleted_for_everyone_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WsEvent =
  | {type: 'session.ready'; userId: string}
  | {type: 'message.created'; chatId: string; message: Message}
  | {type: 'message.edited'; chatId: string; messageId: string}
  | {type: 'message.deleted'; messageId: string; scope: 'me' | 'everyone'}
  | {type: 'chat.member_added'; chatId: string; userId: string}
  | {type: 'chat.member_removed'; chatId: string; userId: string}
  | {type: string; [key: string]: unknown};
