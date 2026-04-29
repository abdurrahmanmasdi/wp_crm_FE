'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

import {
  authControllerResendVerificationV1,
  authControllerVerifyEmailV1,
} from '@/api-generated/endpoints/auth';
import { useUsersControllerGetCurrentUserV1 } from '@/api-generated/endpoints/users';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from '@/i18n/routing';
import { accessTokenCookieAttributes } from '@/lib/auth-cookie';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';

type VerifiableUser = {
  isEmailVerified?: boolean;
  is_email_verified?: boolean;
  email_verified?: boolean;
  status?: string;
};

function isEmailVerified(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }

  const candidate = user as AuthUser & VerifiableUser;

  if (typeof candidate.isEmailVerified === 'boolean') {
    return candidate.isEmailVerified;
  }

  if (typeof candidate.is_email_verified === 'boolean') {
    return candidate.is_email_verified;
  }

  if (typeof candidate.email_verified === 'boolean') {
    return candidate.email_verified;
  }

  if (typeof candidate.status === 'string') {
    return candidate.status.toUpperCase() === 'VERIFIED';
  }

  return false;
}

const RESEND_COOLDOWN_SECONDS = 8;

type VerifyEmailResponse = {
  access_token?: string;
  accessToken?: string;
  user?: AuthUser;
};

function extractAccessToken(
  payload: VerifyEmailResponse | null
): string | null {
  if (!payload) {
    return null;
  }

  if (typeof payload.access_token === 'string' && payload.access_token) {
    return payload.access_token;
  }

  if (typeof payload.accessToken === 'string' && payload.accessToken) {
    return payload.accessToken;
  }

  return null;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storedUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const hasAutoResentRef = useRef(false);
  const hasVerifiedRef = useRef(false);

  const { data: currentUser } = useUsersControllerGetCurrentUserV1({
    query: {
      refetchInterval: 15000,
    },
  });

  const resolvedUser = currentUser ?? storedUser;
  const emailFromQuery = searchParams.get('email');
  const emailForResend = resolvedUser?.email ?? emailFromQuery ?? '';
  const email = emailForResend || 'your email';
  const token = (searchParams.get('token') ?? '').trim();
  const verified = isEmailVerified(resolvedUser ?? null);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser, setUser]);

  useEffect(() => {
    if (verified) {
      router.push('/onboarding/create');
    }
  }, [router, verified]);

  useEffect(() => {
    if (!token || hasVerifiedRef.current) {
      return;
    }

    hasVerifiedRef.current = true;

    const verifyToken = async () => {
      try {
        setIsVerifying(true);
        const response = (await authControllerVerifyEmailV1({
          token,
        })) as unknown as VerifyEmailResponse;
        const accessToken = extractAccessToken(response);

        if (accessToken) {
          Cookies.set('access_token', accessToken, {
            expires: 7,
            ...accessTokenCookieAttributes,
          });
        }

        if (response?.user) {
          setAuth(response.user);
        }

        toast.success('Email verified. Redirecting...');
        router.push('/onboarding/create');
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsVerifying(false);
      }
    };

    void verifyToken();
  }, [router, setAuth, token]);

  useEffect(() => {
    if (resendCooldownSeconds <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setResendCooldownSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [resendCooldownSeconds]);

  const handleResend = useCallback(async () => {
    if (!emailForResend) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      setIsResending(true);
      await authControllerResendVerificationV1({
        email: emailForResend,
      });
      toast.success('Verification email resent.');
      setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  }, [emailForResend]);

  useEffect(() => {
    if (token || !emailForResend || hasAutoResentRef.current) {
      return;
    }

    hasAutoResentRef.current = true;
    void handleResend();
  }, [emailForResend, token, handleResend]);

  return (
    <main className="bg-background text-foreground relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,hsl(var(--accent)/0.18),transparent_45%)]" />

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <Card className="w-full max-w-lg border-white/10 shadow-2xl shadow-black/10">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-full">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle>Verify your email</CardTitle>
                <CardDescription>
                  We sent an email to{' '}
                  <span className="text-foreground font-medium">{email}</span>.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-muted-foreground flex items-center gap-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Waiting for verification... This page will automatically update.
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full"
              onClick={handleResend}
              disabled={isResending || resendCooldownSeconds > 0 || isVerifying}
            >
              {resendCooldownSeconds > 0
                ? `Resend in ${resendCooldownSeconds}s`
                : isResending
                  ? 'Resending...'
                  : 'Resend Email'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
