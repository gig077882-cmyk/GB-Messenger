// ─── HTTP API client ──────────────────────────────────────────────────────────
import type {
  AuthResponse,
  Chat,
  Message,
  Upload,
  User,
  Invite,
  Call,
} from '@/types/api';

const BASE = '/api';

let _accessToken: string | null = null;

export function setAccessToken(t: string | null) {
  _accessToken = t;
}

export function getAccessToken() {
  return _accessToken;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
    ...extraHeaders,
  };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.message ?? 'API error'), { code: data.error, status: res.status });
  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  bootstrap: (email: string, password: string, displayName: string) =>
    request<AuthResponse>('POST', '/auth/bootstrap', { email, password, displayName }),
  register: (email: string, password: string, displayName: string, inviteToken: string) =>
    request<AuthResponse>('POST', '/auth/register', { email, password, displayName, inviteToken }),
  login: (email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { email, password }),
  refresh: () => request<{ accessToken: string }>('POST', '/auth/refresh'),
  logout: () => request<void>('POST', '/auth/logout'),
};

// ─── Me / Users ───────────────────────────────────────────────────────────────

export const users = {
  me: () => request<User>('GET', '/me'),
  update: (patch: Partial<Pick<User, 'displayName' | 'avatarUrl' | 'bio'>>) =>
    request<User>('PATCH', '/me', patch),
  list: (q = '') => request<User[]>('GET', `/users?q=${encodeURIComponent(q)}`),
  updatePrivacy: (prefs: { lastSeen?: 'everyone' | 'contacts' | 'nobody'; readReceipts?: boolean }) =>
    request<{ ok: boolean }>('PATCH', '/me/privacy', prefs),
  blockUser: (userId: string) => request<{ ok: boolean }>('POST', `/users/${userId}/block`),
  unblockUser: (userId: string) => request<{ ok: boolean }>('DELETE', `/users/${userId}/block`),
};

// ─── Invites ──────────────────────────────────────────────────────────────────

export const invites = {
  create: (role: 'admin' | 'member' = 'member', expiresInHours = 72) =>
    request<Invite>('POST', '/invites', { role, expiresInHours }),
};

// ─── Chats ────────────────────────────────────────────────────────────────────

export const chats = {
  list: () => request<Chat[]>('GET', '/chats'),
  createDirect: (userId: string) => request<Chat>('POST', '/chats/direct', { userId }),
  createGroup: (title: string, memberIds: string[]) =>
    request<Chat>('POST', '/chats/group', { title, memberIds }),
  addMember: (chatId: string, userId: string, role: 'admin' | 'member' = 'member') =>
    request<{ ok: boolean }>('POST', `/chats/${chatId}/members`, { userId, role }),
  removeMember: (chatId: string, userId: string) =>
    request<{ ok: boolean }>('DELETE', `/chats/${chatId}/members/${userId}`),
  setPreferences: (chatId: string, prefs: { archived?: boolean; pinned?: boolean }) =>
    request<{ ok: boolean }>('PATCH', `/chats/${chatId}/preferences`, prefs),
  mute: (chatId: string, until: string | null) =>
    request<{ ok: boolean }>('PATCH', `/chats/${chatId}/mute`, { until }),
  setDisappearing: (chatId: string, ttlSeconds: number | null) =>
    request<{ ok: boolean }>('PATCH', `/chats/${chatId}/disappearing`, { ttlSeconds }),
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messages = {
  list: (chatId: string, before?: string, limit = 50) =>
    request<Message[]>(
      'GET',
      `/chats/${chatId}/messages?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`,
    ),
  send: (
    chatId: string,
    body: {
      kind?: 'text' | 'file';
      text?: string;
      fileId?: string;
      replyToId?: string;
      forwardedFromId?: string;
    },
  ) => request<Message>('POST', `/chats/${chatId}/messages`, body),
  delete: (messageId: string, scope: 'me' | 'everyone') =>
    request<{ ok: boolean }>('DELETE', `/messages/${messageId}?scope=${scope}`),
  react: (messageId: string, emoji: string) =>
    request<{ ok: boolean }>('POST', `/messages/${messageId}/reactions`, { emoji }),
  unreact: (messageId: string, emoji: string) =>
    request<{ ok: boolean }>('DELETE', `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),
  receipt: (messageId: string, state: 'delivered' | 'read') =>
    request<{ ok: boolean }>('POST', `/messages/${messageId}/receipt`, { state }),
  edit: (messageId: string, text: string) =>
    request<Message>('PATCH', `/messages/${messageId}`, { text }),
  pin: (messageId: string) => request<{ ok: boolean }>('POST', `/messages/${messageId}/pin`),
  unpin: (messageId: string) => request<{ ok: boolean }>('DELETE', `/messages/${messageId}/pin`),
};

// ─── Search ───────────────────────────────────────────────────────────────────

export const search = {
  messages: (q: string, chatId?: string) =>
    request<Message[]>('GET', `/search?q=${encodeURIComponent(q)}${chatId ? `&chatId=${chatId}` : ''}`),
};

// ─── Uploads ──────────────────────────────────────────────────────────────────

export const uploads = {
  create: (name: string, mimeType: string, sizeBytes: number, sha256: string) =>
    request<{ id: string; chunkSize: number; totalChunks: number }>('POST', '/uploads', {
      name,
      mimeType,
      sizeBytes,
      sha256,
    }),
  status: (id: string) => request<Upload>('GET', `/uploads/${id}`),
  putChunk: async (uploadId: string, index: number, chunk: Blob) => {
    const res = await fetch(`${BASE}/uploads/${uploadId}/chunks/${index}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(chunk.size),
        ..._accessToken ? { Authorization: `Bearer ${_accessToken}` } : {},
      },
      credentials: 'include',
      body: chunk,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw Object.assign(new Error((d as { message?: string }).message ?? 'Chunk upload failed'), { status: res.status });
    }
    return res.json() as Promise<{ index: number; sizeBytes: number }>;
  },
  complete: (uploadId: string) =>
    request<Upload>('POST', `/uploads/${uploadId}/complete`),
  downloadUrl: (uploadId: string) => `${BASE}/uploads/${uploadId}/download`,
};

// ─── Calls ────────────────────────────────────────────────────────────────────

export const calls = {
  create: (chatId: string) => request<Call>('POST', '/calls', { chatId }),
  join: (callId: string) => request<Call>('POST', `/calls/${callId}/join`),
  leave: (callId: string) => request<{ ok: boolean }>('POST', `/calls/${callId}/leave`),
  turnConfig: () => request<{ iceServers: RTCIceServer[]; ttl?: number }>('GET', '/calls/turn-config'),
};

// ─── Polls ────────────────────────────────────────────────────────────────────

export const polls = {
  create: (chatId: string, question: string, options: string[], allowMultiple = false) =>
    request<Message>('POST', `/chats/${chatId}/polls`, { question, options, allowMultiple }),
  vote: (pollId: string, optionIds: string[]) =>
    request<{ ok: boolean }>('POST', `/polls/${pollId}/votes`, { optionIds }),
  results: (pollId: string) =>
    request<{ options: Array<{ id: string; text: string; votes: number }> }>('GET', `/polls/${pollId}/results`),
};
