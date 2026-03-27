import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at?: Date;
  permissions?: string[];
};

type AuthUserState = AuthUser | Record<string, unknown>;

type AuthStore = {
  user: AuthUserState | null;
  activeOrganizationId: string | null;
  permissions: string[] | null; // null = not fetched, [] = fetched but no access
  _hasHydrated: boolean;
  setAuth: (user: AuthUserState | null) => void;
  setUser: (user: AuthUserState | null) => void;
  setActiveOrganizationId: (activeOrganizationId: string | null) => void;
  setPermissions: (permissions: string[]) => void;
  clearPermissions: () => void;
  setHasHydrated: (state: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      activeOrganizationId: null,
      permissions: null,
      _hasHydrated: false,
      setAuth: (user) => set({ user }),
      setUser: (user) => set({ user }),
      setActiveOrganizationId: (activeOrganizationId) =>
        set({ activeOrganizationId }),
      setPermissions: (permissions) => set({ permissions }),
      clearPermissions: () => set({ permissions: null }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      logout: () => {
        Cookies.remove('access_token', { path: '/' });
        set({ user: null, activeOrganizationId: null, permissions: null });
      },
    }),
    {
      name: 'tourcrm-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
