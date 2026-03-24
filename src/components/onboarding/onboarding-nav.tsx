'use client';

import { Languages, MoonStar } from 'lucide-react';

export function OnboardingNav() {
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-[#181c22] px-6 py-4">
      <div className="text-xl font-bold tracking-tighter text-[#57f1db]">
        TourCRM
      </div>

      <div className="flex items-center gap-6">
        <button
          type="button"
          className="flex scale-95 items-center gap-2 text-[#bacac5] transition-transform duration-200 hover:text-[#57f1db] active:scale-90"
        >
          <MoonStar className="h-4 w-4" />
        </button>

        <div className="group flex cursor-pointer items-center gap-2 text-[#bacac5] transition-colors duration-200 hover:text-[#57f1db]">
          <Languages className="h-4 w-4" />
          <span className="text-[0.6875rem] font-semibold tracking-widest uppercase">
            EN
          </span>
        </div>
      </div>
    </nav>
  );
}
