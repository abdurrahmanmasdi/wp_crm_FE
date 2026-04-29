'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  authControllerLoginV1,
  authControllerRegisterV1,
} from '@/api-generated/endpoints/auth';
import {
  usersControllerAcceptInviteV1,
  usersControllerGetCurrentUserV1,
} from '@/api-generated/endpoints/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';

const registerSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

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

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('Auth');
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const inviteToken = searchParams.get('inviteToken');
  const inviteId = searchParams.get('inviteId');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError('');

    try {
      await authControllerRegisterV1({
        ...values,
        ...(inviteToken ? { inviteToken } : {}),
      });

      if (inviteId) {
        await usersControllerAcceptInviteV1(inviteId);
      }

      try {
        await authControllerLoginV1({
          email: values.email,
          password: values.password,
        });
        const userResponse = await usersControllerGetCurrentUserV1();
        setAuth(userResponse);
      } catch {
        setAuth({
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
        } as AuthUser);
      }

      router.push(
        `/auth/verify-email?email=${encodeURIComponent(values.email)}`
      );
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
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
            <h1 className="text-2xl font-semibold">{t('registerTitle')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('registerDescription')}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="first_name">
                {t('firstNameLabel')}
              </label>
              <Input
                id="first_name"
                placeholder={t('firstNamePlaceholder')}
                className="bg-secondary h-11 rounded-2xl border-white/10"
                {...register('first_name')}
              />
              {errors.first_name && (
                <p className="text-sm text-red-400">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="last_name">
                {t('lastNameLabel')}
              </label>
              <Input
                id="last_name"
                placeholder={t('lastNamePlaceholder')}
                className="bg-secondary h-11 rounded-2xl border-white/10"
                {...register('last_name')}
              />
              {errors.last_name && (
                <p className="text-sm text-red-400">
                  {errors.last_name.message}
                </p>
              )}
            </div>

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
              <p className="text-sm text-red-400">{submitError}</p>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-2xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t('creatingAccount') : t('registerButton')}
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-sm">
            {t('haveAccount')}{' '}
            <Link className="text-primary hover:underline" href="/auth/login">
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
