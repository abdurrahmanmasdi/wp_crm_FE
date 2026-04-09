'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { authControllerRequestPasswordResetV1 } from '@/api-generated/endpoints/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getErrorMessage } from '@/lib/error-utils';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth');
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await authControllerRequestPasswordResetV1({
        email: values.email,
      });

      setIsSuccess(true);
      reset();
      toast.success(t('forgotPasswordSuccess'));
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
              {t('forgotPasswordTitle')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('forgotPasswordDescription')}
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

            {isSuccess ? (
              <p className="text-sm text-emerald-400">
                {t('forgotPasswordSuccess')}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-2xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t('sendingResetLink') : t('forgotPasswordButton')}
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
