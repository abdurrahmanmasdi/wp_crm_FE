import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { accessTokenCookieAttributes } from '@/lib/auth-cookie';
import { authService } from '@/lib/auth.service';

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at?: Date;
  permissions?: string[];
};

type AuthStore = {
  user: AuthUser | null;
  activeOrganizationId: string | null;
  permissions: string[] | null; // null = not fetched, [] = fetched but no access
  _hasHydrated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser | null) => void;
  setUser: (user: AuthUser | null) => void;
  setActiveOrganizationId: (activeOrganizationId: string | null) => void;
  setPermissions: (permissions: string[]) => void;
  clearPermissions: () => void;
  clearAuthState: () => void;
  setHasHydrated: (state: boolean) => void;
  startInitialization: () => void;
  finishInitialization: () => void;
  logout: () => Promise<void>;
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
      logout: async () => {
        try {
          // Revoke refresh token backend-side first
          await authService.logout();
        } catch (error) {
          // Log but continue with local cleanup even if backend revocation fails
          console.error('Failed to revoke refresh token:', error);
        }

        // Clear local cookies and Zustand state
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
