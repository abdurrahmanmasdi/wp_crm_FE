'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { usePathname, useRouter } from '@/i18n/routing';
import { orgService, type OrganizationMembership } from '@/lib/org.service';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import { MembershipStatus } from '@/types/enums';

/**
 * Route protection scope used by `useAuthRedirectGate`.
 *
 * - `dashboard`: ensures the user can safely access organization-bound dashboard routes.
 * - `onboarding`: ensures the user is routed to the appropriate onboarding destination.
 */
export type AuthGuardScope = 'dashboard' | 'onboarding';

interface UseAuthRedirectGateResult {
  isReady: boolean;
  isLoading: boolean;
}

function normalizeMemberships(data: unknown): OrganizationMembership[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    const response = data as {
      memberships?: OrganizationMembership[];
      organizations?: OrganizationMembership[];
    };

    return response.memberships ?? response.organizations ?? [];
  }

  return [];
}

function getOrganizationId(
  membership: OrganizationMembership | null
): string | null {
  if (!membership) {
    return null;
  }

  return membership.organization_id ?? membership.organization?.id ?? null;
}

function isCurrentRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.endsWith(route);
}

/**
 * Central auth gate for protected route segments.
 *
 * React Query state managed:
 * - Membership resolution query (`queryKeys.auth.routeMemberships`) while auth bootstrap is complete.
 *
 * Side effects:
 * - Syncs resolved active organization ID into the auth store.
 * - Performs client redirects to login, onboarding, waiting, or dashboard depending on memberships.
 *
 * Redirect flow:
 * 1. Block rendering until persisted auth state is hydrated and `/users/me` initialization is complete.
 * 2. If no authenticated user exists, redirect to `/auth/login`.
 * 3. Resolve organization memberships once and route users to one stable destination:
 *    - Active org membership -> `/dashboard`
 *    - Pending membership -> `/onboarding/waiting`
 *    - No membership -> `/onboarding`
 *
 * @param scope Route context where the guard runs (`dashboard` or `onboarding`).
 * Returning `isReady = true` means the caller can safely render page content with no redirect flash.
 * @returns Readiness flags for rendering and loading-state decisions in guarded layouts/pages.
 */
export function useAuthRedirectGate(
  scope: AuthGuardScope
): UseAuthRedirectGateResult {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const setActiveOrganizationId = useAuthStore(
    (state) => state.setActiveOrganizationId
  );
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);

  const authBootstrapPending = !_hasHydrated || !isInitialized || isLoading;
  const shouldResolveMemberships =
    !authBootstrapPending &&
    user != null &&
    (scope === 'onboarding' || !activeOrganizationId);
  const isWaitingRoute = isCurrentRoute(pathname, '/onboarding/waiting');

  const membershipsQuery = useQuery({
    queryKey: queryKeys.auth.routeMemberships(Boolean(user)),
    queryFn: async () => {
      const response = await orgService.getMyMemberships();
      return response.data;
    },
    enabled: shouldResolveMemberships,
    staleTime: 5000,
    refetchInterval: scope === 'onboarding' && isWaitingRoute ? 5000 : false,
  });

  const memberships = useMemo(
    () => normalizeMemberships(membershipsQuery.data),
    [membershipsQuery.data]
  );

  const activeMembership = memberships.find((membership) => {
    return (
      membership.status === MembershipStatus.ACTIVE &&
      Boolean(getOrganizationId(membership))
    );
  });

  const pendingMembership = memberships.find(
    (membership) => membership.status === MembershipStatus.PENDING
  );

  const resolvedOrganizationId = getOrganizationId(activeMembership ?? null);
  const membershipDecisionPending =
    shouldResolveMemberships && membershipsQuery.isLoading;

  useEffect(() => {
    if (
      !resolvedOrganizationId ||
      activeOrganizationId === resolvedOrganizationId
    ) {
      return;
    }

    setActiveOrganizationId(resolvedOrganizationId);
  }, [resolvedOrganizationId, activeOrganizationId, setActiveOrganizationId]);

  let redirectTo: string | null = null;

  if (!authBootstrapPending) {
    if (user == null) {
      redirectTo = '/auth/login';
    } else if (scope === 'dashboard') {
      if (
        !activeOrganizationId &&
        !membershipDecisionPending &&
        !resolvedOrganizationId
      ) {
        redirectTo = pendingMembership ? '/onboarding/waiting' : '/onboarding';
      }
    } else {
      if (activeOrganizationId || resolvedOrganizationId) {
        redirectTo = '/dashboard';
      } else if (!membershipDecisionPending) {
        if (pendingMembership && !isWaitingRoute) {
          redirectTo = '/onboarding/waiting';
        }

        if (!pendingMembership && isWaitingRoute) {
          redirectTo = '/onboarding';
        }
      }
    }
  }

  useEffect(() => {
    if (!redirectTo || isCurrentRoute(pathname, redirectTo)) {
      return;
    }

    router.replace(redirectTo);
  }, [pathname, redirectTo, router]);

  const waitingForOrganizationSync =
    scope === 'dashboard' &&
    !activeOrganizationId &&
    Boolean(resolvedOrganizationId);

  const waitingForRedirect =
    redirectTo != null && !isCurrentRoute(pathname, redirectTo);

  const isReady =
    !authBootstrapPending &&
    !membershipDecisionPending &&
    !waitingForOrganizationSync &&
    !waitingForRedirect &&
    redirectTo == null;

  return {
    isReady,
    isLoading: !isReady,
  };
}
