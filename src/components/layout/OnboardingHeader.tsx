'use client';

import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function OnboardingHeader() {
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-[#10141a] px-6 py-4">
      {/* Keep the brand lockup identical across onboarding screens. */}
      <div className="flex items-center gap-8">
        <span className="font-headline text-xl font-bold tracking-tighter text-[#dfe2eb]">
          TourCRM
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </nav>
  );
}
