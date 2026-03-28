'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { authService } from '@/lib/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * AuthInitializer Component
 *
 * Fetches the current user's profile on app startup and optionally fetches permissions
 * for the active organization if available.
 *
 * This ensures:
 * 1. Fresh user data after browser refresh
 * 2. Updated permissions based on active organization context
 * 3. Consistent state across tab/window navigation
 */
export function AuthInitializer() {
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuthState = useAuthStore((state) => state.clearAuthState);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    // Wait for Zustand hydration to complete
    if (!_hasHydrated) {
      return;
    }

    // Check if we have a valid access token
    const token = Cookies.get('access_token');
    if (!token) {
      clearAuthState();
      return;
    }

    // Fetch user data and optionally permissions
    const initializeAuth = async () => {
      try {
        // Get user profile
        const userResponse = await authService.me();
        let userData = userResponse.data;

        // If we have an active organization, fetch its permissions
        if (activeOrganizationId) {
          try {
            const permissionsResponse =
              await authService.getPermissions(activeOrganizationId);
            userData = {
              ...userData,
              permissions: permissionsResponse.data.permissions,
            };
          } catch {
            // If permissions fetch fails, continue with user data (permissions will be empty)
            // This prevents blocking user initialization if permission fetch fails
          }
        }

        // Save the entire response (including permissions if available) to Zustand
        setAuth(userData);
      } catch {
        // If /users/me fails (e.g., token expired), clear all auth state.
        clearAuthState();
      }
    };

    initializeAuth();
  }, [_hasHydrated, activeOrganizationId, setAuth, clearAuthState]);

  // This component doesn't render anything
  return null;
}
