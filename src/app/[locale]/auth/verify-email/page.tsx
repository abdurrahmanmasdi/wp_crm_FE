'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, MailWarning, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import {
  authControllerResendVerificationV1,
  authControllerVerifyEmailV1,
} from '@/api-generated/endpoints/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getErrorMessage } from '@/lib/error-utils';

type VerificationStatus = 'loading' | 'success' | 'error';
const RESEND_COOLDOWN_SECONDS = 8;

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const t = useTranslations('Auth');
  const token = (searchParams.get('token') ?? '').trim();

  const verifyTriggeredRef = useRef(false);
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(
    searchParams.get('email') ?? ''
  );
  const [isResending, setIsResending] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage(t('verifyEmailTokenMissing'));
      return;
    }

    if (verifyTriggeredRef.current) {
      return;
    }

    verifyTriggeredRef.current = true;

    const verify = async () => {
      try {
        setStatus('loading');
        setErrorMessage('');
        await authControllerVerifyEmailV1({ token });
        setStatus('success');
      } catch (error) {
        setStatus('error');
        setErrorMessage(getErrorMessage(error) || t('somethingWrong'));
      }
    };

    void verify();
  }, [t, token]);

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

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = resendEmail.trim();
    if (!normalizedEmail) {
      toast.error(t('emailValidationError'));
      return;
    }

    try {
      setIsResending(true);
      await authControllerResendVerificationV1({
        email: normalizedEmail,
      });
      toast.success(t('resendVerificationSuccess'));
      setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      toast.error(getErrorMessage(error) || t('somethingWrong'));
    } finally {
      setIsResending(false);
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
            <h1 className="text-2xl font-semibold">{t('verifyEmailTitle')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('verifyEmailDescription')}
            </p>
          </div>

          {status === 'loading' ? (
            <section className="space-y-4 py-3">
              <div className="border-primary/30 border-t-primary mx-auto h-10 w-10 animate-spin rounded-full border-2" />
              <p className="text-muted-foreground text-center text-sm">
                {t('verifyingEmailLoading')}
              </p>
            </section>
          ) : null}

          {status === 'success' ? (
            <section className="space-y-5 py-2">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <p className="text-center text-sm text-emerald-400">
                {t('verifyEmailSuccess')}
              </p>

              <Button asChild className="h-11 w-full rounded-2xl font-semibold">
                <Link href="/auth/login">{t('proceedToLogin')}</Link>
              </Button>
            </section>
          ) : null}

          {status === 'error' ? (
            <section className="space-y-4 py-2">
              <div className="flex justify-center">
                <TriangleAlert className="h-12 w-12 text-amber-500" />
              </div>
              <p className="text-center text-sm text-red-400">
                {errorMessage || t('verifyEmailErrorFallback')}
              </p>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-amber-400">
                  <MailWarning className="h-4 w-4" />
                  <p className="text-sm font-semibold">
                    {t('resendVerificationTitle')}
                  </p>
                </div>

                {resendCooldownSeconds > 0 ? (
                  <p className="text-sm text-amber-300">
                    {t('resendVerificationCooldown', {
                      seconds: resendCooldownSeconds,
                    })}
                  </p>
                ) : (
                  <form className="space-y-3" onSubmit={handleResend}>
                    <Input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={resendEmail}
                      onChange={(event) => setResendEmail(event.target.value)}
                      className="bg-secondary h-11 rounded-2xl border-white/10"
                    />
                    <Button
                      type="submit"
                      disabled={isResending}
                      className="h-10 w-full rounded-xl"
                    >
                      {isResending
                        ? t('resendingVerification')
                        : t('resendVerificationButton')}
                    </Button>
                  </form>
                )}
              </div>

              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/auth/login">{t('backToLogin')}</Link>
              </Button>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
