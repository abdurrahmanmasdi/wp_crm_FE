'use client';

import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { OnboardingHeader } from '@/components/layout/OnboardingHeader';
import { LoadingSpinner } from '@/components/onboarding/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { orgService } from '@/lib/org.service';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/useAuthStore';
import { OnboardingFooter } from '@/components/onboarding/onboarding-footer';

const joinWorkspaceSchema = z.object({
  slug: z.string().trim().min(3, 'Workspace URL must be at least 3 characters'),
});

type JoinWorkspaceFormValues = z.infer<typeof joinWorkspaceSchema>;

export default function JoinWorkspacePage() {
  const router = useRouter();
  const t = useTranslations('Onboarding.Join');
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
      const message = getErrorMessage(error);
      setError('slug', {
        type: 'server',
        message: message,
      });
      toast.error(message);
    }
  };

  if (!_hasHydrated || user == null || activeOrganizationId) {
    return (
      <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground relative flex min-h-screen flex-col">
      <OnboardingHeader />

      <section className="bg-background flex flex-1 flex-col items-center justify-center px-4 pt-24 pb-12">
        <section className="bg-background relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/30 md:p-12">
          <div className="bg-primary/5 absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl" />

          <header className="mb-10 space-y-2">
            <h1 className="font-headline text-foreground text-3xl font-bold tracking-tight md:text-4xl">
              {t('title')}
            </h1>
            <p className="text-muted-foreground text-base">
              {t('description')}
            </p>
          </header>

          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3">
              <label
                className="font-label text-muted-foreground block text-xs font-bold tracking-widest uppercase"
                htmlFor="slug"
              >
                {t('slugLabel')}
              </label>

              <div className="group flex items-stretch">
                <div className="bg-secondary/40 text-muted-foreground rounded-l-2xl border border-r-0 border-white/10 px-4 py-4 font-medium whitespace-nowrap">
                  {t('slugPrefix')}
                </div>

                <div className="relative w-full">
                  <Input
                    id="slug"
                    placeholder={t('slugPlaceholder')}
                    autoComplete="off"
                    className="bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 h-auto rounded-l-none rounded-r-2xl border-white/10 px-4 py-4 focus-visible:ring-1"
                    {...register('slug')}
                  />
                  <div className="bg-primary absolute bottom-0 left-0 h-px w-0 shadow-[0_0_8px_var(--glow-primary-full)] transition-all duration-500 group-focus-within:w-full" />
                </div>
              </div>

              <p className="text-muted-foreground mt-2 text-[10px] italic">
                {t('slugHint')}
              </p>

              {errors.slug?.message ? (
                <div className="text-destructive rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm">
                  {errors.slug.message}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/onboarding')}
                className="text-muted-foreground hover:text-foreground rounded-full px-6 py-3 text-sm font-bold tracking-wide transition-colors duration-200 hover:bg-white/5"
              >
                {t('backButton')}
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="glow-button bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-10 py-3 text-sm font-bold tracking-tight transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="border-primary-foreground/20 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2" />
                    Joining...
                  </>
                ) : (
                  <>
                    {t('submitButton')}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

        <div className="pointer-events-none fixed bottom-0 left-0 -z-10 h-1/2 w-full opacity-20">
          <div className="from-primary/10 absolute inset-0 bg-linear-to-t to-transparent" />
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
