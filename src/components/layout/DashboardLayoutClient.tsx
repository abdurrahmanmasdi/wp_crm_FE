'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { ChatSocketProvider } from '@/providers/ChatSocketProvider';
import { cn } from '@/lib/utils';
import { fetchMyPermissions } from '@/lib/api/users';

function LoadingSpinner() {
  return (
    <div className="border-primary/30 border-t-primary h-10 w-10 animate-spin rounded-full border-2" />
  );
}

export function DashboardLayoutClient({
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
  const permissions = useAuthStore((state) => state.permissions);
  const setPermissions = useAuthStore((state) => state.setPermissions);

  useEffect(() => {
    if (!_hasHydrated || user == null) {
      return;
    }

    if (!activeOrganizationId) {
      router.push('/onboarding');
    }
  }, [_hasHydrated, activeOrganizationId, user, router]);

  /**
   * Fetch permissions for the active organization if not yet cached
   * Runs only once per activeOrganizationId change
   */
  useEffect(() => {
    // Don't fetch if we don't have the required prerequisites
    if (!activeOrganizationId || permissions !== null) {
      return;
    }

    const fetchPermissions = async () => {
      try {
        const data = await fetchMyPermissions(activeOrganizationId);
        setPermissions(data);
      } catch {
        // On error, set empty permissions to avoid infinite loops
        // User will have no permissions but can still access the dashboard
        setPermissions([]);
      }
    };

    fetchPermissions();
  }, [activeOrganizationId, permissions, setPermissions]);

  if (
    !_hasHydrated ||
    user == null ||
    !activeOrganizationId ||
    permissions === null
  ) {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ChatSocketProvider>
      <div className="bg-background text-foreground min-h-screen">
        <Sidebar />

        <div className={cn('min-h-screen', isRTL ? 'mr-64' : 'ml-64')}>
          <DashboardHeader />

          <main className="bg-secondary min-h-[calc(100vh-64px)] px-6 py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </ChatSocketProvider>
  );
}
