'use client';

import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function OnboardingHeader() {
  return (
    <nav className="bg-background fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4">
      {/* Keep the brand lockup identical across onboarding screens. */}
      <div className="flex items-center gap-8">
        <span className="font-headline text-foreground text-xl font-bold tracking-tighter">
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
