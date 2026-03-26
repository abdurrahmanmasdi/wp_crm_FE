'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { OnboardingHeader } from '@/components/layout/OnboardingHeader';
import { Button } from '@/components/ui/button';

export default function PreferencesPage() {
  const router = useRouter();
  const t = useTranslations('Onboarding.Preferences');

  return (
    <main className="bg-background text-foreground relative flex min-h-screen flex-col">
      <OnboardingHeader />

      <section className="bg-background flex grow flex-col items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <span className="font-label text-primary text-xs font-bold tracking-widest uppercase">
                {t('step')}
              </span>
              <span className="font-body text-muted-foreground text-sm font-medium">
                {t('subtitle')}
              </span>
            </div>

            <div className="bg-secondary h-1 w-full overflow-hidden rounded-full">
              <div className="bg-primary h-full w-full shadow-[0_0_10px_var(--glow-primary-xxl)]" />
            </div>
          </div>

          <section className="bg-card relative overflow-hidden rounded-2xl border border-white/10 p-8 text-center shadow-2xl shadow-black/30 md:p-12">
            <div className="bg-primary/5 absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl" />

            <p className="text-primary mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
              {t('badge')}
            </p>
            <h1 className="text-foreground mb-3 text-3xl font-bold tracking-tight">
              {t('title')}
            </h1>
            <p className="text-muted-foreground mx-auto max-w-md text-sm leading-6">
              {t('description')}
            </p>

            <Button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 rounded-full px-8 py-3 text-sm font-bold"
            >
              {t('continueButton')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </section>
        </div>
      </section>
    </main>
  );
}
