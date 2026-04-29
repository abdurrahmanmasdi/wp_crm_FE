'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { usersControllerGetCurrentUserV1 } from '@/api-generated/endpoints/users';
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

  const isUnverifiedEmailError = (error: unknown): boolean => {
    if (!axios.isAxiosError(error)) {
      return false;
    }

    const responseMessage =
      error.response?.data?.message ?? error.response?.data?.error;
    const normalizedMessage =
      typeof responseMessage === 'string'
        ? responseMessage.toLowerCase()
        : Array.isArray(responseMessage) && responseMessage.length > 0
          ? String(responseMessage[0]).toLowerCase()
          : '';

    return (
      (error.response?.status === 403 &&
        normalizedMessage.includes('verify') &&
        normalizedMessage.includes('email')) ||
      normalizedMessage.includes('email not verified') ||
      normalizedMessage.includes('unverified') ||
      normalizedMessage.includes('verification required')
    );
  };

  useEffect(() => {
    // Wait for Zustand hydration to complete
    if (!_hasHydrated) {
      return;
    }

    let isMounted = true;

    // Fetch user data once after hydration to establish auth state.
    const initializeAuth = async () => {
      startInitialization();

      try {
        const userResponse = await usersControllerGetCurrentUserV1();

        if (isMounted) {
          setAuth(userResponse);
        }
      } catch (error) {
        if (isMounted && !isUnverifiedEmailError(error)) {
          // If /users/me fails for non-verification reasons, clear auth state.
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
