'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { OnboardingHeader } from '@/components/layout/OnboardingHeader';
import { Button } from '@/components/ui/button';

export default function PreferencesPage() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen flex-col bg-[#0d1117] text-[#dfe2eb]">
      <OnboardingHeader />

      <section className="flex grow flex-col items-center justify-center bg-[#0a0e14] px-4 pt-24 pb-12">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <span className="font-label text-xs font-bold tracking-widest text-[#57f1db] uppercase">
                Step 3 of 3: Preferences
              </span>
              <span className="font-body text-sm font-medium text-[#bacac5]">
                Final Step
              </span>
            </div>

            <div className="h-1 w-full overflow-hidden rounded-full bg-[#1c2026]">
              <div className="h-full w-full bg-[#57f1db] shadow-[0_0_10px_rgba(87,241,219,0.4)]" />
            </div>
          </div>

          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#161b22] p-8 text-center shadow-2xl shadow-black/30 md:p-12">
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#00f0ff]/5 blur-3xl" />

            <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#00f0ff] uppercase">
              Temporary page
            </p>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#dfe2eb]">
              Preferences will live here later.
            </h1>
            <p className="mx-auto max-w-md text-sm leading-6 text-[#bacac5]">
              This is a simple placeholder so the onboarding flow stays complete
              while we build out the final preferences experience.
            </p>

            <Button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="mt-8 rounded-full bg-[#00f0ff] px-8 py-3 text-sm font-bold text-[#003731] hover:bg-[#00f0ff]/90"
            >
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </section>
        </div>
      </section>
    </main>
  );
}
