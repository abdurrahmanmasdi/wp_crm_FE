'use client';

import { Building2, PlusCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { LoadingSpinner } from '@/components/onboarding/loading-spinner';
import { OnboardingChoiceCard } from '@/components/onboarding/onboarding-choice-card';
import { OnboardingFooter } from '@/components/onboarding/onboarding-footer';
import { OnboardingNav } from '@/components/onboarding/onboarding-nav';
import { orgService, type OrganizationMembership } from '@/lib/org.service';
import { MembershipStatus } from '@/types/enums';
import { useAuthStore } from '@/store/useAuthStore';

function getDisplayName(user: unknown) {
  if (!user || typeof user !== 'object') {
    return 'there';
  }

  const profile = user as { firstName?: string; first_name?: string };

  return profile.firstName ?? profile.first_name ?? 'there';
}

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

export default function OnboardingPage() {
  const router = useRouter();
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const logout = useAuthStore((state) => state.logout);

  const membershipsQuery = useQuery({
    queryKey: ['my-memberships'],
    queryFn: async () => {
      const response = await orgService.getMyMemberships();
      return response.data;
    },
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
  }, [_hasHydrated, activeOrganizationId, user, router]);

  useEffect(() => {
    if (!_hasHydrated || membershipsQuery.isLoading) {
      return;
    }

    const memberships = getMemberships(membershipsQuery.data);

    if (memberships.length === 0) {
      return;
    }

    const pendingMembership = memberships.find(
      (membership) => membership.status === MembershipStatus.PENDING
    );

    if (pendingMembership) {
      router.push('/onboarding/waiting');
      return;
    }

    const activeMembership = memberships.find(
      (membership) => membership.status === MembershipStatus.ACTIVE
    );

    if (activeMembership) {
      const organizationId = getOrganizationId(activeMembership);

      if (organizationId) {
        useAuthStore.getState().setActiveOrganizationId(organizationId);
      }

      router.push('/dashboard');
    }
  }, [_hasHydrated, membershipsQuery.data, membershipsQuery.isLoading, router]);

  if (!_hasHydrated || !user || activeOrganizationId) {
    return (
      <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
        <LoadingSpinner />
      </main>
    );
  }

  const displayName = getDisplayName(user);

  return (
    <main className="bg-background text-foreground relative flex min-h-screen flex-col">
      <OnboardingNav />

      <section className="flex grow flex-col items-center justify-center px-6 pt-24 pb-32">
        <div className="w-full max-w-4xl space-y-16 text-center">
          <header className="space-y-4">
            <h1 className="font-headline text-foreground text-[3.5rem] leading-none font-bold tracking-[-0.04em]">
              Welcome to TourCRM,{' '}
              <span className="text-primary">{displayName}</span>.
            </h1>
            <p className="font-body text-muted-foreground text-[1.125rem] font-medium tracking-[-0.01em]">
              How would you like to get started?
            </p>
          </header>

          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
            <OnboardingChoiceCard
              href="/onboarding/join"
              icon={Building2}
              title="Join an Existing Agency"
              description="I have an invite code or workspace URL"
              ctaLabel="Proceed"
            />
            <OnboardingChoiceCard
              href="/onboarding/create"
              icon={PlusCircle}
              title="Create New Workspace"
              description="I am setting up TourCRM for my company"
              ctaLabel="Get Started"
            />
          </div>
        </div>
      </section>

      <OnboardingFooter
        onSignOut={() => {
          logout();
          router.push('/auth/login');
        }}
      />

      <div className="bg-accent/5 pointer-events-none fixed top-1/2 left-1/2 -z-10 h-200 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
    </main>
  );
}
