'use client';

import { Building2, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Onboarding');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) {
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
              {t('Greeting.welcome', { displayName })}{' '}
            </h1>
            <p className="font-body text-muted-foreground text-[1.125rem] font-medium tracking-[-0.01em]">
              {t('Greeting.question')}
            </p>
          </header>

          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
            <OnboardingChoiceCard
              href="/onboarding/join"
              icon={Building2}
              title={t('ChoiceCards.joinTitle')}
              description={t('ChoiceCards.joinDescription')}
              ctaLabel={t('ChoiceCards.joinCta')}
            />
            <OnboardingChoiceCard
              href="/onboarding/create"
              icon={PlusCircle}
              title={t('ChoiceCards.createTitle')}
              description={t('ChoiceCards.createDescription')}
              ctaLabel={t('ChoiceCards.createCta')}
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
