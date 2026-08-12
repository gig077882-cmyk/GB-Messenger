// ─── Auth store ───────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api';
import { auth as authApi, setAccessToken } from '@/lib/api';
import { wsClient } from '@/lib/ws';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  // actions
  bootstrap: (email: string, password: string, displayName: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, inviteToken: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      bootstrap: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.bootstrap(email, password, displayName);
          setAccessToken(res.accessToken);
          wsClient.connect(res.accessToken);
          set({ user: res.user, accessToken: res.accessToken, isLoading: false });
        } catch (e) {
          set({ error: (e as Error).message, isLoading: false });
          throw e;
        }
      },

      register: async (email, password, displayName, inviteToken) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.register(email, password, displayName, inviteToken);
          setAccessToken(res.accessToken);
          wsClient.connect(res.accessToken);
          set({ user: res.user, accessToken: res.accessToken, isLoading: false });
        } catch (e) {
          set({ error: (e as Error).message, isLoading: false });
          throw e;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.login(email, password);
          setAccessToken(res.accessToken);
          wsClient.connect(res.accessToken);
          set({ user: res.user, accessToken: res.accessToken, isLoading: false });
        } catch (e) {
          set({ error: (e as Error).message, isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        wsClient.disconnect();
        await authApi.logout().catch(() => {});
        setAccessToken(null);
        set({ user: null, accessToken: null });
      },

      refresh: async () => {
        try {
          const res = await authApi.refresh();
          setAccessToken(res.accessToken);
          const { user } = get();
          if (user) wsClient.connect(res.accessToken);
          set({ accessToken: res.accessToken });
          return true;
        } catch {
          setAccessToken(null);
          set({ user: null, accessToken: null });
          return false;
        }
      },

      setUser: (user) => set({ user }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'krug-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAccessToken(state.accessToken);
          wsClient.connect(state.accessToken);
        }
      },
    },
  ),
);
