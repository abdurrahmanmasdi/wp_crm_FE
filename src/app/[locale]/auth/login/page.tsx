'use client';

import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { authControllerLoginV1 } from '@/api-generated/endpoints/auth';
import { usersControllerGetCurrentUserV1 } from '@/api-generated/endpoints/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { accessTokenCookieAttributes } from '@/lib/auth-cookie';
import { useAuthStore } from '@/store/useAuthStore';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      error.response?.data?.message ?? error.response?.data?.error;

    if (typeof responseMessage === 'string') {
      return responseMessage;
    }

    if (Array.isArray(responseMessage) && responseMessage.length > 0) {
      return responseMessage[0];
    }

    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

function isWrongPasswordError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (error.response?.status === 401) {
    return true;
  }

  const responseMessage =
    error.response?.data?.message ?? error.response?.data?.error;
  const normalizedMessage =
    typeof responseMessage === 'string'
      ? responseMessage.toLowerCase()
      : Array.isArray(responseMessage) && responseMessage.length > 0
        ? String(responseMessage[0]).toLowerCase()
        : '';

  return (
    normalizedMessage.includes('password') ||
    normalizedMessage.includes('invalid credential') ||
    normalizedMessage.includes('invalid login') ||
    normalizedMessage.includes('incorrect')
  );
}

function isUnverifiedEmailError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const responseMessage =
    error.response?.data?.message ?? error.response?.data?.error;
  const normalizedMessage =
    typeof responseMessage === 'string'
      ? responseMessage.toLowerCase()
      : Array.isArray(responseMessage) && responseMessage.length > 0
        ? String(responseMessage[0]).toLowerCase()
        : '';

  return (
    (error.response?.status === 403 &&
      normalizedMessage.includes('verify') &&
      normalizedMessage.includes('email')) ||
    normalizedMessage.includes('email not verified') ||
    normalizedMessage.includes('unverified') ||
    normalizedMessage.includes('verification required')
  );
}

function extractAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;

  if (typeof data.access_token === 'string' && data.access_token.length > 0) {
    return data.access_token;
  }

  if (typeof data.accessToken === 'string' && data.accessToken.length > 0) {
    return data.accessToken;
  }

  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Auth');
  const setAuth = useAuthStore((state) => state.setAuth);
  const [submitError, setSubmitError] = useState('');
  const [showForgotPasswordLink, setShowForgotPasswordLink] = useState(false);
  const [showVerifyEmailLink, setShowVerifyEmailLink] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError('');
    setShowForgotPasswordLink(false);
    setShowVerifyEmailLink(false);
    setVerificationEmail('');

    try {
      const loginResponse = await authControllerLoginV1(values);
      const accessToken = extractAccessToken(loginResponse);

      if (accessToken) {
        Cookies.set('access_token', accessToken, {
          expires: 7,
          ...accessTokenCookieAttributes,
        });
      }

      const userResponse = await usersControllerGetCurrentUserV1();
      setAuth(userResponse);

      const returnTo = searchParams.get('returnTo');
      const safeReturnTo =
        returnTo && returnTo.startsWith('/') ? returnTo : null;

      router.push(safeReturnTo ?? '/dashboard');
    } catch (error) {
      const wrongPasswordError = isWrongPasswordError(error);
      const unverifiedEmailError = isUnverifiedEmailError(error);

      setSubmitError(getApiErrorMessage(error));
      setShowForgotPasswordLink(wrongPasswordError && !unverifiedEmailError);
      setShowVerifyEmailLink(unverifiedEmailError);
      if (unverifiedEmailError) {
        setVerificationEmail(values.email.trim());
      }
    }
  };

  return (
    <main className="bg-background text-foreground min-h-screen px-6 py-10">
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <div className="bg-card w-full rounded-2xl border border-white/10 p-6 shadow-2xl shadow-black/20">
          <div className="mb-6 space-y-2">
            <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
              {t('privateBeta')}
            </p>
            <h1 className="text-2xl font-semibold">{t('loginTitle')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('loginDescription')}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                {t('emailLabel')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                className="bg-secondary h-11 rounded-2xl border-white/10"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                {t('passwordLabel')}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                className="bg-secondary h-11 rounded-2xl border-white/10"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {submitError ? (
              <div className="space-y-1">
                <p className="text-sm text-red-400">{submitError}</p>
                {showForgotPasswordLink ? (
                  <Link
                    className="text-primary text-sm hover:underline"
                    href="/auth/forgot-password"
                  >
                    {t('forgotPasswordTitle')}
                  </Link>
                ) : null}
                {showVerifyEmailLink ? (
                  <Link
                    className="text-primary text-sm hover:underline"
                    href={
                      verificationEmail
                        ? `/auth/verify-email?email=${encodeURIComponent(verificationEmail)}`
                        : '/auth/verify-email'
                    }
                  >
                    {t('verifyEmailLink')}
                  </Link>
                ) : null}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-2xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t('signingIn') : t('loginButton')}
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-sm">
            {t('needAccount')}{' '}
            <Link
              className="text-primary hover:underline"
              href="/auth/register"
            >
              {t('registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
