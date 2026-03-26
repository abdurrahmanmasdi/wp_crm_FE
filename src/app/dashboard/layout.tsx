'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Sidebar } from '@/components/layout/Sidebar';
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

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#dfe2eb]">
      <Sidebar />

      <div className="ml-64 min-h-screen">
        <DashboardHeader />

        <main className="bg-[#0a0e14] px-6 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
