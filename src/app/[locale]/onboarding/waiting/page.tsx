'use client';

import { Clock3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/onboarding/loading-spinner';
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

function getMembershipId(membership: OrganizationMembership | null) {
  return membership?.membership_id ?? null;
}

export default function WaitingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('Onboarding.Waiting');
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const membershipsQuery = useQuery({
    queryKey: ['my-memberships'],
    queryFn: async () => {
      const response = await orgService.getMyMemberships();
      return response.data;
    },
    refetchInterval: 5000,
    enabled: isInitialized && !isLoading && user != null,
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

  if (
    !isInitialized ||
    isLoading ||
    user == null ||
    membershipsQuery.isLoading
  ) {
    return (
      <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
        <LoadingSpinner />
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
          {t('title')}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-6">
          {t('description')}
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

              toast.error(t('cancelError'));
            }}
            disabled={cancelRequestMutation.isPending}
            className="mt-8 rounded-full border-white/10 bg-transparent px-5 text-red-200 hover:bg-red-500/5 hover:text-red-400"
          >
            {cancelRequestMutation.isPending ? (
              <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300/30 border-t-red-200" />
            ) : null}
            {t('cancelButton')}
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
            {t('logoutButton')}
          </Button>
        </div>
      </div>
    </main>
  );
}
