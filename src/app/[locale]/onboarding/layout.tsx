import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';

interface OnboardingLayoutProps {
  children: ReactNode;
}

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

type MembershipCheckResult =
  | 'has-active-membership'
  | 'no-membership'
  | 'unauthorized';

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizeMembershipList(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const list = record.memberships ?? record.organizations ?? [];
    return Array.isArray(list) ? list : [];
  }

  return [];
}

function isActiveMembership(entry: unknown): boolean {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const record = entry as Record<string, unknown>;
  const status = asString(record.status)?.toUpperCase();

  const organizationRecord =
    record.organization && typeof record.organization === 'object'
      ? (record.organization as Record<string, unknown>)
      : null;

  const organizationId =
    asString(record.organization_id) ?? asString(organizationRecord?.id);

  if (status) {
    return status === 'ACTIVE' && Boolean(organizationId);
  }

  // Fallback for simplified response shapes without explicit status.
  return Boolean(organizationId);
}

async function checkMembership(token: string): Promise<MembershipCheckResult> {
  const response = await fetch(`${apiBaseUrl}/users/me/organizations`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    return 'unauthorized';
  }

  if (!response.ok) {
    return 'no-membership';
  }

  const data = (await response.json()) as unknown;
  const memberships = normalizeMembershipList(data);

  const hasActiveMembership = memberships.some((entry) =>
    isActiveMembership(entry)
  );

  return hasActiveMembership ? 'has-active-membership' : 'no-membership';
}

export default async function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  const token = (await cookies()).get('access_token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  try {
    const membershipResult = await checkMembership(token);

    if (membershipResult === 'unauthorized') {
      redirect('/auth/login');
    }

    if (membershipResult === 'has-active-membership') {
      redirect('/dashboard');
    }
  } catch {
    // Fail open here so onboarding is still reachable if the membership check fails unexpectedly.
  }

  return children;
}
