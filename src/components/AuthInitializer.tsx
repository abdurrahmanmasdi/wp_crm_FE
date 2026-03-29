'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { authService } from '@/lib/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * AuthInitializer Component
 *
 * Fetches the current user's profile once on app startup after persisted auth state
 * finishes hydration.
 *
 * This ensures:
 * 1. Fresh user data after browser refresh
 * 2. A strict `isInitialized=false` window while `/users/me` is in flight
 * 3. Consistent auth bootstrap state for route guards
 */
export function AuthInitializer() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuthState = useAuthStore((state) => state.clearAuthState);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const startInitialization = useAuthStore(
    (state) => state.startInitialization
  );
  const finishInitialization = useAuthStore(
    (state) => state.finishInitialization
  );

  useEffect(() => {
    // Wait for Zustand hydration to complete
    if (!_hasHydrated) {
      return;
    }

    let isMounted = true;

    // Fetch user data once after hydration to establish auth state.
    const initializeAuth = async () => {
      startInitialization();

      const token = Cookies.get('access_token');
      if (!token) {
        if (isMounted) {
          clearAuthState();
          finishInitialization();
        }
        return;
      }

      try {
        const userResponse = await authService.me();

        if (isMounted) {
          setAuth(userResponse.data);
        }
      } catch {
        if (isMounted) {
          // If /users/me fails (e.g., token expired), clear all auth state.
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          finishInitialization();
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [
    _hasHydrated,
    setAuth,
    clearAuthState,
    startInitialization,
    finishInitialization,
  ]);

  // This component doesn't render anything
  return null;
}
