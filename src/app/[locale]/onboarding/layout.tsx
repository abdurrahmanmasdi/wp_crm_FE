import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';

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

  return children;
}
