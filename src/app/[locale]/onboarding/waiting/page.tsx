'use client';

import { Clock3 } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { orgService, type OrganizationMembership } from '@/lib/org.service';
import { getErrorMessage } from '@/lib/error-utils';
import { MembershipStatus } from '@/types/enums';
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
  return membership.organization_id ?? membership.organization?.id ?? null;
}

function getMembershipId(membership: OrganizationMembership | null) {
  return membership?.membership_id ?? null;
}

export default function WaitingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const pendingMembershipId = getMembershipId(
    getMemberships(membershipsQuery.data).find(
      (membership) => membership.status === MembershipStatus.PENDING
    ) ?? null
  );

  const cancelRequestMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      return orgService.cancelRequest(membershipId);
    },
    onSuccess: async () => {
      toast.success('Your request has been canceled.');
      await queryClient.invalidateQueries({ queryKey: ['my-memberships'] });
      router.push('/onboarding');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
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
      (membership) => membership.status === MembershipStatus.ACTIVE
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
      (membership) => membership.status === MembershipStatus.PENDING
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
      <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
        <div className="border-primary/30 border-t-primary h-10 w-10 animate-spin rounded-full border-2" />
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-6">
      <div className="bg-card relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 p-8 text-center shadow-2xl shadow-black/30">
        <div className="bg-primary/5 absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl" />

        <div className="mb-6 flex justify-center">
          <Clock3 className="text-primary h-14 w-14 animate-pulse" />
        </div>

        <h1 className="text-foreground mb-3 text-2xl font-bold tracking-tight">
          Your request has been sent.
        </h1>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-6">
          We are waiting for a workspace admin to approve your access. You will
          be redirected automatically when approved.
        </p>

        <div className="flex flex-col justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (pendingMembershipId) {
                cancelRequestMutation.mutate(pendingMembershipId);
                return;
              }

              toast.error('Could not find a pending request to cancel.');
            }}
            disabled={cancelRequestMutation.isPending}
            className="mt-8 rounded-full border-white/10 bg-transparent px-5 text-red-200 hover:bg-red-500/5 hover:text-red-400"
          >
            {cancelRequestMutation.isPending ? (
              <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300/30 border-t-red-200" />
            ) : null}
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
