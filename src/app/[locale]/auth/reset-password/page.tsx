'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { authControllerResetPasswordV1 } from '@/api-generated/endpoints/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getErrorMessage } from '@/lib/error-utils';

type ResetPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Auth');
  const token = (searchParams.get('token') ?? '').trim();
  const missingToken = token.length === 0;

  const resetPasswordSchema = useMemo(
    () =>
      z
        .object({
          newPassword: z.string().min(8, t('passwordMinError')),
          confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
        })
        .refine((values) => values.newPassword === values.confirmPassword, {
          path: ['confirmPassword'],
          message: t('passwordsDoNotMatch'),
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (missingToken) {
      toast.error(t('resetPasswordTokenMissing'));
      return;
    }

    try {
      await authControllerResetPasswordV1({
        token,
        newPassword: values.newPassword,
      });

      toast.success(t('resetPasswordSuccess'));
      router.push('/auth/login');
    } catch (error) {
      toast.error(getErrorMessage(error) || t('somethingWrong'));
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
            <h1 className="text-2xl font-semibold">
              {t('resetPasswordTitle')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('resetPasswordDescription')}
            </p>
          </div>

          {missingToken ? (
            <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
              {t('resetPasswordTokenMissing')}
            </p>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="newPassword">
                {t('newPasswordLabel')}
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder={t('newPasswordPlaceholder')}
                className="bg-secondary h-11 rounded-2xl border-white/10"
                {...register('newPassword')}
              />
              {errors.newPassword ? (
                <p className="text-sm text-red-400">
                  {errors.newPassword.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                {t('confirmPasswordLabel')}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('confirmPasswordPlaceholder')}
                className="bg-secondary h-11 rounded-2xl border-white/10"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-red-400">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || missingToken}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-2xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t('resettingPassword') : t('resetPasswordButton')}
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-sm">
            <Link className="text-primary hover:underline" href="/auth/login">
              {t('backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
