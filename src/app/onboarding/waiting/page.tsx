'use client';

import { Clock3 } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { orgService, type OrganizationMembership } from '@/lib/org.service';
import { useAuthStore } from '@/store/useAuthStore';

function getMemberships(data: unknown): OrganizationMembership[] {
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

function getOrganizationId(membership: OrganizationMembership) {
  return membership.organizationId ?? membership.organization?.id ?? null;
}

export default function WaitingPage() {
  const router = useRouter();
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const setActiveOrganizationId = useAuthStore(
    (state) => state.setActiveOrganizationId
  );

  const membershipsQuery = useQuery({
    queryKey: ['my-memberships'],
    queryFn: async () => {
      const response = await orgService.getMyMemberships();
      return response.data;
    },
    refetchInterval: 5000,
    enabled: _hasHydrated && user != null,
  });

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    if (user == null) {
      router.push('/auth/login');
      return;
    }

    if (activeOrganizationId) {
      router.push('/dashboard');
    }
  }, [_hasHydrated, activeOrganizationId, router, user]);

  useEffect(() => {
    if (!_hasHydrated || membershipsQuery.isLoading) {
      return;
    }

    const memberships = getMemberships(membershipsQuery.data);

    if (memberships.length === 0) {
      router.push('/onboarding');
      return;
    }

    const activeMembership = memberships.find(
      (membership) => membership.status === 'active'
    );

    if (activeMembership) {
      const organizationId = getOrganizationId(activeMembership);

      if (organizationId) {
        setActiveOrganizationId(organizationId);
      }

      router.push('/dashboard');
      return;
    }

    const hasPendingApproval = memberships.some(
      (membership) => membership.status === 'pending_approval'
    );

    if (!hasPendingApproval) {
      router.push('/onboarding');
    }
  }, [
    _hasHydrated,
    membershipsQuery.data,
    membershipsQuery.isLoading,
    router,
    setActiveOrganizationId,
  ]);

  if (!_hasHydrated || user == null || activeOrganizationId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d1117] px-6 text-[#dfe2eb]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00f0ff]/30 border-t-[#00f0ff]" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0d1117] px-6 text-[#dfe2eb]">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#161b22] p-8 text-center shadow-2xl shadow-black/30">
        <div className="absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#00f0ff]/5 blur-3xl" />

        <div className="mb-6 flex justify-center">
          <Clock3 className="h-14 w-14 animate-pulse text-[#00f0ff]" />
        </div>

        <h1 className="mb-3 text-2xl font-bold tracking-tight text-[#dfe2eb]">
          Your request has been sent.
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-6 text-[#bacac5]">
          We are waiting for a workspace admin to approve your access. You will
          be redirected automatically when approved.
        </p>

        <div className="flex flex-col justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log('TODO: Call DELETE /cancel-invite API');
              router.push('/onboarding');
            }}
            className="mt-8 rounded-full border-white/10 bg-transparent px-5 text-red-200 hover:bg-red-500/5 hover:text-red-400"
          >
            Cancel Request
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              logout();
              router.push('/auth/login');
            }}
            className="rounded-full border-white/10 bg-transparent px-5 text-red-200 hover:bg-red-500/5 hover:text-red-400"
          >
            Logout
          </Button>
        </div>
      </div>
    </main>
  );
}
