'use client';

import axios from 'axios';
import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { OnboardingHeader } from '@/components/layout/OnboardingHeader';
import { LoadingSpinner } from '@/components/onboarding/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { orgService } from '@/lib/org.service';
import { useAuthStore } from '@/store/useAuthStore';
import { OnboardingFooter } from '@/components/onboarding/onboarding-footer';

const joinWorkspaceSchema = z.object({
  slug: z.string().trim().min(3, 'Workspace URL must be at least 3 characters'),
});

type JoinWorkspaceFormValues = z.infer<typeof joinWorkspaceSchema>;

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

export default function JoinWorkspacePage() {
  const router = useRouter();
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const logout = useAuthStore((state) => state.logout);
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<JoinWorkspaceFormValues>({
    resolver: zodResolver(joinWorkspaceSchema),
    defaultValues: {
      slug: '',
    },
  });

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    if (activeOrganizationId) {
      router.push('/dashboard');
      return;
    }

    if (user == null) {
      router.push('/auth/login');
    }
  }, [_hasHydrated, activeOrganizationId, router, user]);

  const onSubmit = async (values: JoinWorkspaceFormValues) => {
    try {
      await orgService.joinOrganization({
        slug: values.slug.trim(),
      });

      router.push('/onboarding/waiting');
    } catch (error) {
      setError('slug', {
        type: 'server',
        message: getApiErrorMessage(error),
      });
    }
  };

  if (!_hasHydrated || user == null || activeOrganizationId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d1117] px-6 text-[#dfe2eb]">
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#0d1117] text-[#dfe2eb]">
      <OnboardingHeader />

      <section className="flex flex-1 flex-col items-center justify-center bg-[#0d1117] px-4 pt-24 pb-12">
        <section className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#181c22] p-8 shadow-2xl shadow-black/30 md:p-12">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#57f1db]/5 blur-3xl" />

          <header className="mb-10 space-y-2">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-[#dfe2eb] md:text-4xl">
              Let&apos;s join your workspace
            </h1>
            <p className="text-base text-[#bacac5]">
              Enter the workspace URL or slug you were invited to.
            </p>
          </header>

          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3">
              <label
                className="font-label block text-xs font-bold tracking-widest text-[#bacac5] uppercase"
                htmlFor="slug"
              >
                Workspace URL
              </label>

              <div className="group flex items-stretch">
                <div className="rounded-l-2xl border border-r-0 border-white/10 bg-[#31353c]/40 px-4 py-4 font-medium whitespace-nowrap text-[#bacac5]">
                  tourcrm.com/
                </div>

                <div className="relative w-full">
                  <Input
                    id="slug"
                    placeholder="bosphorus"
                    autoComplete="off"
                    className="h-auto rounded-l-none rounded-r-2xl border-white/10 bg-[#262a31] px-4 py-4 text-[#dfe2eb] placeholder:text-[#859490] focus-visible:ring-1 focus-visible:ring-[#57f1db]/50"
                    {...register('slug')}
                  />
                  <div className="absolute bottom-0 left-0 h-px w-0 bg-[#57f1db] shadow-[0_0_8px_rgba(87,241,219,0.8)] transition-all duration-500 group-focus-within:w-full" />
                </div>
              </div>

              <p className="mt-2 text-[10px] text-[#859490] italic">
                This will be the permanent URL for your workspace.
              </p>

              {errors.slug?.message ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-[#ffb4ab]">
                  {errors.slug.message}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/onboarding')}
                className="rounded-full px-6 py-3 text-sm font-bold tracking-wide text-[#bacac5] transition-colors duration-200 hover:bg-white/5 hover:text-[#dfe2eb]"
              >
                Back
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="glow-button rounded-2xl bg-[#57f1db] px-10 py-3 text-sm font-bold tracking-tight text-[#003731] transition-all duration-200 hover:bg-[#57f1db]/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#003731]/20 border-t-[#003731]" />
                    Joining...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

        <div className="pointer-events-none fixed bottom-0 left-0 -z-10 h-1/2 w-full opacity-20">
          <div className="absolute inset-0 bg-linear-to-t from-[#57f1db]/10 to-transparent" />
        </div>
      </section>

      <OnboardingFooter
        onSignOut={() => {
          logout();
          router.push('/auth/login');
        }}
      />
    </main>
  );
}
