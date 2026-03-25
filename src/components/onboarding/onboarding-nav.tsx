'use client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export function OnboardingNav() {
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-[#181c22] px-6 py-4">
      <div className="text-xl font-bold tracking-tighter text-[#57f1db]">
        TourCRM
      </div>

      <div className="flex items-center gap-6">
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </nav>
  );
}
