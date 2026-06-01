import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/client';
import type { AuthUser } from '../types';

type AuthState = {
  user: AuthUser | null;
  /** False until first GET /auth/me (or login) completes. */
  ready: boolean;
  setUser: (user: AuthUser | null) => void;
  setReady: (ready: boolean) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      ready: false,
      setUser: (user) => set({ user }),
      setReady: (ready) => set({ ready }),
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          /* clear client state even if network fails */
        }
        set({ user: null, ready: true });
      },
    }),
    {
      name: 'recruit-mvp-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

export type { AuthUser } from '../types';
