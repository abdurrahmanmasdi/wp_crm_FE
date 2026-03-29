import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';

import { AuthRouteGuard } from '@/components/auth/AuthRouteGuard';
import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const token = (await cookies()).get('access_token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  return (
    <AuthRouteGuard scope="dashboard" loadingLabel="Loading your dashboard...">
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </AuthRouteGuard>
  );
}
