'use client';

import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { authService } from '@/lib/auth.service';
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

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [submitError, setSubmitError] = useState('');

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

    try {
      const loginResponse = await authService.login(values);

      Cookies.set('access_token', loginResponse.data.access_token, {
        expires: 7,
        sameSite: 'lax',
        path: '/',
      });

      const userResponse = await authService.me();
      setAuth(userResponse.data);
      router.push('/dashboard');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1117] px-6 py-10 text-[#dfe2eb]">
      <div className="absolute top-6 right-6">
        <LanguageToggle />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <div className="w-full rounded-2xl border border-white/10 bg-[#161b22] p-6 shadow-2xl shadow-black/20">
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#00f0ff] uppercase">
              Private Beta
            </p>
            <h1 className="text-2xl font-semibold">Login to continue</h1>
            <p className="text-sm text-[#8b949e]">
              Sign in to continue to onboarding.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="work@company.com"
                className="h-11 rounded-2xl border-white/10 bg-[#0d1117]"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-2xl border-white/10 bg-[#0d1117]"
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
              className="h-11 w-full rounded-2xl bg-[#00f0ff] text-black hover:bg-[#00f0ff]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Login'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-[#8b949e]">
            Need an account?{' '}
            <Link
              className="text-[#00f0ff] hover:underline"
              href="/auth/register"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
