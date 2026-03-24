'use client';

import { Building2, PlusCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { LoadingSpinner } from '@/components/onboarding/loading-spinner';
import { OnboardingChoiceCard } from '@/components/onboarding/onboarding-choice-card';
import { OnboardingFooter } from '@/components/onboarding/onboarding-footer';
import { OnboardingNav } from '@/components/onboarding/onboarding-nav';
import { useAuthStore } from '@/store/useAuthStore';

function getDisplayName(user: unknown) {
  if (!user || typeof user !== 'object') {
    return 'there';
  }

  const profile = user as { firstName?: string; first_name?: string };

  return profile.firstName ?? profile.first_name ?? 'there';
}

export default function OnboardingPage() {
  const router = useRouter();
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const logout = useAuthStore((state) => state.logout);

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

  if (!_hasHydrated || !user || activeOrganizationId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d1117] px-6 text-[#dfe2eb]">
        <LoadingSpinner />
      </main>
    );
  }

  const displayName = getDisplayName(user);

  return (
    <main className="relative flex min-h-screen flex-col bg-[#0d1117] text-[#dfe2eb]">
      <OnboardingNav />

      <section className="flex grow flex-col items-center justify-center px-6 pt-24 pb-32">
        <div className="w-full max-w-4xl space-y-16 text-center">
          <header className="space-y-4">
            <h1 className="font-headline text-[3.5rem] leading-none font-bold tracking-[-0.04em] text-[#dfe2eb]">
              Welcome to TourCRM,{' '}
              <span className="text-[#2dd4bf]">{displayName}</span>.
            </h1>
            <p className="font-body text-[1.125rem] font-medium tracking-[-0.01em] text-[#bacac5]">
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

      <div className="pointer-events-none fixed top-1/2 left-1/2 -z-10 h-200 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2dd4bf]/5 blur-[120px]" />
    </main>
  );
}
