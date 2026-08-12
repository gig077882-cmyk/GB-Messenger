// ─── Chats store ──────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { Chat, Message, User } from '@/types/api';
import { chats as chatsApi, messages as messagesApi, users as usersApi } from '@/lib/api';

interface ReactionMap {
  [emoji: string]: string[]; // emoji -> userIds
}

interface MessageWithReactions extends Message {
  reactions: ReactionMap;
}

interface TypingState {
  [chatId: string]: Set<string>; // chatId -> Set<userId>
}

interface ChatsState {
  chats: Chat[];
  messages: Record<string, MessageWithReactions[]>; // chatId -> messages
  users: Record<string, User>; // userId -> User
  typing: TypingState;
  onlineUsers: Set<string>;
  activeChatId: string | null;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;

  // actions
  loadChats: () => Promise<void>;
  loadMessages: (chatId: string, before?: string) => Promise<void>;
  loadUsers: () => Promise<void>;
  setActiveChat: (chatId: string | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  deleteMessage: (messageId: string, scope: 'me' | 'everyone') => void;
  updateMessage: (messageId: string, patch: Partial<Message>) => void;
  updateReaction: (messageId: string, userId: string, emoji: string, active: boolean) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  setOnline: (userId: string, online: boolean) => void;
  updateChatOrder: (chatId: string) => void;
  upsertUser: (user: User) => void;
  addChatMember: (chatId: string, member: unknown) => void;
  removeChatMember: (chatId: string, userId: string) => void;
}

export const useChatsStore = create<ChatsState>()((set, get) => ({
  chats: [],
  messages: {},
  users: {},
  typing: {},
  onlineUsers: new Set(),
  activeChatId: null,
  isLoadingChats: false,
  isLoadingMessages: false,

  loadChats: async () => {
    set({ isLoadingChats: true });
    try {
      const list = await chatsApi.list();
      set({ chats: list, isLoadingChats: false });
    } catch {
      set({ isLoadingChats: false });
    }
  },

  loadMessages: async (chatId, before) => {
    set({ isLoadingMessages: true });
    try {
      const msgs = await messagesApi.list(chatId, before);
      const existing = get().messages[chatId] ?? [];
      const withReactions: MessageWithReactions[] = msgs.map((m) => ({
        ...m,
        reactions: {},
      }));
      // prepend older messages
      const merged = before
        ? [...withReactions.reverse(), ...existing]
        : [...withReactions.reverse()];
      set((s) => ({
        messages: { ...s.messages, [chatId]: merged },
        isLoadingMessages: false,
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  loadUsers: async () => {
    try {
      const list = await usersApi.list();
      const map: Record<string, User> = {};
      list.forEach((u) => (map[u.id] = u));
      set({ users: map });
    } catch {
      // ignore
    }
  },

  setActiveChat: (chatId) => set({ activeChatId: chatId }),

  addMessage: (chatId, message) => {
    set((s) => {
      const existing = s.messages[chatId] ?? [];
      const withR: MessageWithReactions = { ...message, reactions: {} };
      return { messages: { ...s.messages, [chatId]: [...existing, withR] } };
    });
    get().updateChatOrder(chatId);
  },

  deleteMessage: (messageId, scope) => {
    set((s) => {
      const updated: Record<string, MessageWithReactions[]> = {};
      for (const [cid, msgs] of Object.entries(s.messages)) {
        updated[cid] = msgs.map((m) => {
          if (m.id !== messageId) return m;
          if (scope === 'everyone') return { ...m, text: null, file_id: null, deleted_for_everyone_at: new Date().toISOString() };
          return m; // 'me' scope handled by filtering on load
        });
      }
      return { messages: updated };
    });
  },

  updateMessage: (messageId, patch) => {
    set((s) => {
      const updated: Record<string, MessageWithReactions[]> = {};
      for (const [cid, msgs] of Object.entries(s.messages)) {
        updated[cid] = msgs.map((m) => {
          if (m.id !== messageId) return m;
          return { ...m, ...patch };
        });
      }
      return { messages: updated };
    });
  },

  updateReaction: (messageId, userId, emoji, active) => {
    set((s) => {
      const updated: Record<string, MessageWithReactions[]> = {};
      for (const [cid, msgs] of Object.entries(s.messages)) {
        updated[cid] = msgs.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = { ...m.reactions };
          const users = [...(reactions[emoji] ?? [])];
          if (active && !users.includes(userId)) users.push(userId);
          if (!active) {
            const idx = users.indexOf(userId);
            if (idx !== -1) users.splice(idx, 1);
          }
          if (users.length === 0) delete reactions[emoji];
          else reactions[emoji] = users;
          return { ...m, reactions };
        });
      }
      return { messages: updated };
    });
  },

  setTyping: (chatId, userId, isTyping) => {
    set((s) => {
      const current = new Set(s.typing[chatId] ?? []);
      if (isTyping) current.add(userId);
      else current.delete(userId);
      return { typing: { ...s.typing, [chatId]: current } };
    });
  },

  setOnline: (userId, online) => {
    set((s) => {
      const next = new Set(s.onlineUsers);
      if (online) next.add(userId);
      else next.delete(userId);
      return { onlineUsers: next };
    });
  },

  updateChatOrder: (chatId) => {
    set((s) => {
      const idx = s.chats.findIndex((c) => c.id === chatId);
      if (idx === -1) return s;
      const chat = { ...s.chats[idx], updated_at: new Date().toISOString() };
      const rest = s.chats.filter((_, i) => i !== idx);
      return { chats: [chat, ...rest] };
    });
  },

  upsertUser: (user) => {
    set((s) => ({ users: { ...s.users, [user.id]: user } }));
  },

  addChatMember: (chatId, member) => {
    set((s) => {
      const idx = s.chats.findIndex((c) => c.id === chatId);
      if (idx === -1) return s;
      const chat = s.chats[idx] as Chat & { members?: unknown[] };
      if (!Array.isArray(chat.members)) return s;
      const updatedChat = { ...chat, members: [...chat.members, member] };
      const chats = [...s.chats];
      chats[idx] = updatedChat as Chat;
      return { chats };
    });
  },

  removeChatMember: (chatId, userId) => {
    set((s) => {
      const idx = s.chats.findIndex((c) => c.id === chatId);
      if (idx === -1) return s;
      const chat = s.chats[idx] as Chat & { members?: Array<{ id?: string; user_id?: string }> };
      if (!Array.isArray(chat.members)) return s;
      const updatedChat = {
        ...chat,
        members: chat.members.filter((m) => (m.id ?? m.user_id) !== userId),
      };
      const chats = [...s.chats];
      chats[idx] = updatedChat as Chat;
      return { chats };
    });
  },
}));
