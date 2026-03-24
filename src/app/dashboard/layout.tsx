'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
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
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    if (user == null) {
      router.push('/auth/login');
      return;
    }

    if (!activeOrganizationId) {
      router.push('/onboarding');
    }
  }, [_hasHydrated, activeOrganizationId, user, router]);

  if (!_hasHydrated || user == null || !activeOrganizationId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117] px-6 text-[#dfe2eb]">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
