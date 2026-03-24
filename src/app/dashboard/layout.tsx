'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useAuthStore } from '@/store/useAuthStore';

function LoadingSpinner() {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00f0ff]/30 border-t-[#00f0ff]" />
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const router = useRouter();
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const hasHydrated = useAuthHydrated();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!activeOrganizationId) {
      router.push('/onboarding');
    }
  }, [activeOrganizationId, hasHydrated, router]);

  if (!hasHydrated || !activeOrganizationId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117] px-6 text-[#dfe2eb]">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
