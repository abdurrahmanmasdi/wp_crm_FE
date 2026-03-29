'use client';

import { type ReactNode } from 'react';

import { AuthFullscreenLoader } from '@/components/auth/AuthFullscreenLoader';
import {
  useAuthRedirectGate,
  type AuthGuardScope,
} from '@/hooks/useAuthRedirectGate';

interface AuthRouteGuardProps {
  scope: AuthGuardScope;
  children: ReactNode;
  loadingLabel?: string;
}

/**
 * UI guard wrapper for protected route trees.
 *
 * This component intentionally renders only a full-screen branded loader while
 * `useAuthRedirectGate` resolves auth initialization and destination redirects.
 * As a result, dashboard/onboarding pages never render briefly on the wrong route.
 */
export function AuthRouteGuard({
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
