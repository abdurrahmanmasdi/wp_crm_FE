import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';

import { AuthRouteGuard } from '@/components/auth/AuthRouteGuard';

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default async function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  const token = (await cookies()).get('access_token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  return (
    <AuthRouteGuard scope="onboarding" loadingLabel="Preparing onboarding...">
      {children}
    </AuthRouteGuard>
  );
}
