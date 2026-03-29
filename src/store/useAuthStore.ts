import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { accessTokenCookieAttributes } from '@/lib/auth-cookie';

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
  isInitialized: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUserState | null) => void;
  setUser: (user: AuthUserState | null) => void;
  setActiveOrganizationId: (activeOrganizationId: string | null) => void;
  setPermissions: (permissions: string[]) => void;
  clearPermissions: () => void;
  clearAuthState: () => void;
  setHasHydrated: (state: boolean) => void;
  startInitialization: () => void;
  finishInitialization: () => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      activeOrganizationId: null,
      permissions: null,
      _hasHydrated: false,
      isInitialized: false,
      isLoading: true,
      setAuth: (user) => set({ user }),
      setUser: (user) => set({ user }),
      setActiveOrganizationId: (activeOrganizationId) =>
        set({ activeOrganizationId }),
      setPermissions: (permissions) => set({ permissions }),
      clearPermissions: () => set({ permissions: null }),
      clearAuthState: () => {
        Cookies.remove('access_token', accessTokenCookieAttributes);
        set({
          user: null,
          activeOrganizationId: null,
          permissions: null,
          isInitialized: true,
          isLoading: false,
        });
      },
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      startInitialization: () => set({ isInitialized: false, isLoading: true }),
      finishInitialization: () =>
        set({ isInitialized: true, isLoading: false }),
      logout: () => {
        Cookies.remove('access_token', accessTokenCookieAttributes);
        set({
          user: null,
          activeOrganizationId: null,
          permissions: null,
          isInitialized: true,
          isLoading: false,
        });
      },
    }),
    {
      name: 'tourcrm-auth-storage',
      partialize: (state) => ({
        user: state.user,
        activeOrganizationId: state.activeOrganizationId,
        permissions: state.permissions,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
