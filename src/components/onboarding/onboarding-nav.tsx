'use client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export function OnboardingNav() {
  return (
    <nav className="bg-background fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4">
      <div className="text-primary text-xl font-bold tracking-tighter">
        TourCRM
      </div>

      <div className="flex items-center gap-6">
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </nav>
  );
}
