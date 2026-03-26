'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

function LoadingSpinner() {
  return (
    <div className="border-primary/30 border-t-primary h-10 w-10 animate-spin rounded-full border-2" />
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === 'ar';
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
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Sidebar />

      <div className={cn('min-h-screen', isRTL ? 'mr-64' : 'ml-64')}>
        <DashboardHeader />

        <main className="bg-secondary h-[calc(100vh-64px)] px-6 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
