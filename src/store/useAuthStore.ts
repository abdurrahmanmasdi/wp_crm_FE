import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

type AuthUserState = AuthUser | Record<string, unknown>;

type AuthStore = {
  user: AuthUserState | null;
  activeOrganizationId: string | null;
  setAuth: (user: AuthUserState | null) => void;
  setUser: (user: AuthUserState | null) => void;
  setActiveOrganizationId: (activeOrganizationId: string | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      activeOrganizationId: null,
      setAuth: (user) => set({ user }),
      setUser: (user) => set({ user }),
      setActiveOrganizationId: (activeOrganizationId) =>
        set({ activeOrganizationId }),
      logout: () => set({ user: null, activeOrganizationId: null }),
    }),
    {
      name: 'tourcrm-auth-storage',
    }
  )
);
