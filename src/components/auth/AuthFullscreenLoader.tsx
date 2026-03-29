'use client';

import { LoadingSpinner } from '@/components/onboarding/loading-spinner';

interface AuthFullscreenLoaderProps {
  label?: string;
}

export function AuthFullscreenLoader({
  label = 'Preparing your workspace...',
}: AuthFullscreenLoaderProps) {
  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-primary text-xs font-semibold tracking-[0.24em] uppercase">
          TourCRM
        </p>
        <LoadingSpinner />
        <p className="text-muted-foreground text-sm">{label}</p>
      </div>
    </div>
  );
}
