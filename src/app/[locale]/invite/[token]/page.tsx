'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import { toast } from 'sonner';

import {
  organizationsControllerAcceptInvitationV1,
  organizationsControllerGetInvitationByTokenV1,
} from '@/api-generated/endpoints/organizations';
import { getErrorMessage } from '@/lib/error-utils';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';

type InvitationDetails = {
  organizationName: string;
  roleName: string;
  email: string;
  status: string;
};

type AcceptInvitationResponse = {
  message?: string;
  organizationId?: string;
  membershipId?: string;
};

function normalizeInvitationDetails(data: unknown): InvitationDetails {
  const source = data && typeof data === 'object' ? data : {};
  const record = source as Record<string, unknown>;

  return {
    organizationName:
      (typeof record.organizationName === 'string'
        ? record.organizationName
        : '') || '',
    roleName:
      (typeof record.roleName === 'string' ? record.roleName : '') || '',
    email: (typeof record.email === 'string' ? record.email : '') || '',
    status: (typeof record.status === 'string' ? record.status : '') || '',
  };
}

export default function InvitationLandingPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const t = useTranslations('InviteLanding');

  const token = useMemo(() => {
    const value = params?.token;
    return typeof value === 'string' ? value : '';
  }, [params]);

  const isHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);
  const setActiveOrganizationId = useAuthStore(
    (state) => state.setActiveOrganizationId
  );

  const detailsQuery = useQuery({
    queryKey: queryKeys.organizations.invitationDetails(token),
    enabled: token.length > 0,
    retry: false,
    queryFn: async () => {
      const data = (await organizationsControllerGetInvitationByTokenV1(
        token
      )) as unknown;
      return normalizeInvitationDetails(data);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const data = (await organizationsControllerAcceptInvitationV1(
        token
      )) as AcceptInvitationResponse;
      return data;
    },
    onSuccess: (data) => {
      if (data.organizationId) {
        setActiveOrganizationId(data.organizationId);
      }
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const isInvalidInvitation =
    detailsQuery.error &&
    axios.isAxiosError(detailsQuery.error) &&
    detailsQuery.error.response?.status === 404;

  if (!token) {
    return (
      <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
        <section className="bg-card w-full max-w-xl rounded-2xl border border-white/10 p-8 text-center shadow-2xl shadow-black/20">
          <h1 className="text-xl font-semibold">{t('invalidTitle')}</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {t('invalidDescription')}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-10">
      <section className="bg-card w-full max-w-2xl rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/20">
        {detailsQuery.isLoading ? (
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold">{t('loadingTitle')}</p>
            <p className="text-muted-foreground text-sm">
              {t('loadingDescription')}
            </p>
          </div>
        ) : isInvalidInvitation ? (
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold">{t('invalidTitle')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('invalidDescription')}
            </p>
          </div>
        ) : detailsQuery.error ? (
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold">{t('errorTitle')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('errorDescription')}
            </p>
          </div>
        ) : (
          <>
            <header className="space-y-3 text-center">
              <p className="text-primary text-[11px] font-bold tracking-[0.2em] uppercase">
                {t('badge')}
              </p>
              <h1 className="text-2xl font-semibold md:text-3xl">
                {t('title')}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                {t('invitedMessage', {
                  organization:
                    detailsQuery.data?.organizationName ||
                    t('organizationFallback'),
                  role: detailsQuery.data?.roleName || t('roleFallback'),
                })}
              </p>
            </header>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">
                {t('invitedEmailLabel')}
              </p>
              <p className="mt-2 text-sm font-medium">
                {detailsQuery.data?.email || t('emailFallback')}
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-end gap-3 sm:flex-row">
              {!isHydrated ? (
                <Button type="button" disabled className="w-full sm:w-auto">
                  {t('checkingSession')}
                </Button>
              ) : user ? (
                <Button
                  type="button"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {acceptMutation.isPending
                    ? t('acceptingButton')
                    : t('acceptButton')}
                </Button>
              ) : (
                <>
                  <Link
                    href={`/auth/login?returnTo=/invite/${token}`}
                    className="w-full sm:w-auto"
                  >
                    <Button type="button" variant="outline" className="w-full">
                      {t('loginButton')}
                    </Button>
                  </Link>
                  <Link
                    href={`/auth/register?inviteToken=${encodeURIComponent(token)}`}
                    className="w-full sm:w-auto"
                  >
                    <Button type="button" className="w-full">
                      {t('createAccountButton')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
