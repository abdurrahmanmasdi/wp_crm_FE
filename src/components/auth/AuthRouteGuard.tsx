'use client';

import { type ReactNode, useEffect } from 'react';

import { AuthFullscreenLoader } from '@/components/auth/AuthFullscreenLoader';
import {
  useAuthRedirectGate,
  type AuthGuardScope,
} from '@/hooks/useAuthRedirectGate';
import { usePathname, useRouter } from '@/i18n/routing';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';

interface AuthRouteGuardProps {
  scope: AuthGuardScope;
  children: ReactNode;
  loadingLabel?: string;
}

type VerifiableUser = {
  isEmailVerified?: boolean;
  is_email_verified?: boolean;
  email_verified?: boolean;
  status?: string;
};

function isCurrentRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.endsWith(route);
}

function isEmailVerified(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }

  const candidate = user as AuthUser & VerifiableUser;

  if (typeof candidate.isEmailVerified === 'boolean') {
    return candidate.isEmailVerified;
  }

  if (typeof candidate.is_email_verified === 'boolean') {
    return candidate.is_email_verified;
  }

  if (typeof candidate.email_verified === 'boolean') {
    return candidate.email_verified;
  }

  if (typeof candidate.status === 'string') {
    return candidate.status.toUpperCase() === 'VERIFIED';
  }

  return false;
}

function VerifiedAuthRouteGuard({
  scope,
  children,
  loadingLabel,
}: AuthRouteGuardProps) {
  const { isReady } = useAuthRedirectGate(scope);

  if (!isReady) {
    return <AuthFullscreenLoader label={loadingLabel} />;
  }

  return <>{children}</>;
}

/**
 * UI guard wrapper for protected route trees.
 *
 * This component intentionally renders only a full-screen branded loader while
 * auth initialization and destination redirects resolve.
 */
export function AuthRouteGuard({
  scope,
  children,
  loadingLabel,
}: AuthRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);

  const authBootstrapPending = !_hasHydrated || !isInitialized || isLoading;
  const verified = isEmailVerified(user);

  let redirectTo: string | null = null;

  if (!authBootstrapPending) {
    if (!user) {
      redirectTo = '/auth/login';
    } else if (!verified && (scope === 'dashboard' || scope === 'onboarding')) {
      redirectTo = '/auth/verify-email';
    }
  }

  useEffect(() => {
    if (!redirectTo || isCurrentRoute(pathname, redirectTo)) {
      return;
    }

    router.replace(redirectTo);
  }, [pathname, redirectTo, router]);

  if (authBootstrapPending || redirectTo) {
    return <AuthFullscreenLoader label={loadingLabel} />;
  }

  return (
    <VerifiedAuthRouteGuard scope={scope} loadingLabel={loadingLabel}>
      {children}
    </VerifiedAuthRouteGuard>
  );
}
