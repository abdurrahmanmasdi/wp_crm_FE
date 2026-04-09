'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { LoadingSpinner } from '@/components/onboarding/loading-spinner';
import { OnboardingFooter } from '@/components/onboarding/onboarding-footer';
import { OnboardingHeader } from '@/components/layout/OnboardingHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createOrganization } from '@/lib/api/organization';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/useAuthStore';

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Company Name must be at least 2 characters'),
});

type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;

function slugifyWorkspaceName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function CreateWorkspacePage() {
  const router = useRouter();
  const t = useTranslations('Onboarding.Create');
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const logout = useAuthStore((state) => state.logout);

  const {
    register,
    handleSubmit,
    setValue,
    // setError,
    clearErrors,
    formState: { errors, isSubmitting },
    control,
  } = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
    },
  });

  const name = useWatch({ control, name: 'name' });

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    if (user == null) {
      router.push('/auth/login');
    }
  }, [_hasHydrated, router, user]);

  useEffect(() => {
    // Auto-fill the slug from the company name until the user starts customizing it.
    if (!name) {
      return;
    }

    const nextSlug = slugifyWorkspaceName(name);

    if (!nextSlug) {
      return;
    }
  }, [clearErrors, name, setValue]);

  const onSubmit = async (values: CreateWorkspaceFormValues) => {
    try {
      const organization = await createOrganization({
        name: values.name.trim(),
      });

      useAuthStore.getState().setActiveOrganizationId(organization.id);

      // Step 2 begins immediately after workspace creation.
      router.push('/onboarding/invite');
    } catch (error) {
      const message = getErrorMessage(error);
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

      <section className="bg-background flex grow flex-col items-center justify-center px-4 pt-24 pb-12">
        <div className="mb-8 w-full max-w-xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <span className="font-label text-primary text-xs font-bold tracking-widest uppercase">
                {t('step')}
              </span>
              <span className="font-body text-muted-foreground text-sm font-medium">
                {t('subtitle')}
              </span>
            </div>

            <div className="bg-secondary h-1 w-full overflow-hidden rounded-full">
              <div className="bg-primary h-full w-1/3 shadow-[0_0_10px_var(--glow-primary-xxl)]" />
            </div>
          </div>
        </div>

        <section className="bg-card relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/30 md:p-12">
          <div className="bg-primary/5 absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl" />

          <header className="mb-10 space-y-3">
            <div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              {t('badge')}
            </div>
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
                htmlFor="name"
              >
                {t('companyNameLabel')}
              </label>

              <div className="group relative">
                <Input
                  id="name"
                  placeholder={t('companyNamePlaceholder')}
                  autoComplete="organization"
                  className="bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 h-auto rounded-2xl border-white/10 px-4 py-4 focus-visible:ring-1"
                  {...register('name')}
                />
                <div className="bg-primary absolute bottom-0 left-0 h-px w-0 shadow-[0_0_8px_var(--glow-primary-full)] transition-all duration-500 group-focus-within:w-full" />
              </div>

              {errors.name?.message ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                  {errors.name.message}
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
                    {t('loadingButton')}
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
