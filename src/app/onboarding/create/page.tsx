'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { LoadingSpinner } from '@/components/onboarding/loading-spinner';
import { OnboardingFooter } from '@/components/onboarding/onboarding-footer';
import { OnboardingHeader } from '@/components/layout/OnboardingHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { orgService } from '@/lib/org.service';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/useAuthStore';

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Company Name must be at least 2 characters'),
  slug: z
    .string()
    .trim()
    .min(3, 'Workspace URL must be at least 3 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and hyphens only'
    ),
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
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const logout = useAuthStore((state) => state.logout);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
    control,
  } = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const name = useWatch({ control, name: 'name' });
  const slug = useWatch({ control, name: 'slug' });

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
    if (!name || isSlugManuallyEdited) {
      return;
    }

    const nextSlug = slugifyWorkspaceName(name);

    if (!nextSlug) {
      return;
    }

    if (slug !== nextSlug) {
      setValue('slug', nextSlug, {
        shouldDirty: true,
        shouldValidate: true,
      });
      clearErrors('slug');
    }
  }, [clearErrors, isSlugManuallyEdited, name, setValue, slug]);

  const onSubmit = async (values: CreateWorkspaceFormValues) => {
    try {
      const response = await orgService.createOrganization({
        name: values.name.trim(),
        slug: values.slug.trim(),
      });

      useAuthStore.getState().setActiveOrganizationId(response.data.id);

      // Step 2 begins immediately after workspace creation.
      router.push('/onboarding/invite');
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
      <main className="flex min-h-screen items-center justify-center bg-[#0d1117] px-6 text-[#dfe2eb]">
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#0d1117] text-[#dfe2eb]">
      <OnboardingHeader />

      <section className="flex grow flex-col items-center justify-center bg-[#0a0e14] px-4 pt-24 pb-12">
        <div className="mb-8 w-full max-w-xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <span className="font-label text-xs font-bold tracking-widest text-[#57f1db] uppercase">
                Step 1 of 3
              </span>
              <span className="font-body text-sm font-medium text-[#bacac5]">
                Company Profile
              </span>
            </div>

            <div className="h-1 w-full overflow-hidden rounded-full bg-[#1c2026]">
              <div className="h-full w-1/3 bg-[#57f1db] shadow-[0_0_10px_rgba(87,241,219,0.4)]" />
            </div>
          </div>
        </div>

        <section className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#161b22] p-8 shadow-2xl shadow-black/30 md:p-12">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#00f0ff]/5 blur-3xl" />

          <header className="mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00f0ff]/20 bg-[#00f0ff]/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-[#00f0ff] uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Workspace setup
            </div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-[#dfe2eb] md:text-4xl">
              Let&apos;s set up your workspace
            </h1>
            <p className="text-base text-[#bacac5]">
              Give your company a name and we&apos;ll suggest a clean workspace
              URL you can use right away.
            </p>
          </header>

          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3">
              <label
                className="font-label block text-xs font-bold tracking-widest text-[#bacac5] uppercase"
                htmlFor="name"
              >
                Company Name
              </label>

              <div className="group relative">
                <Input
                  id="name"
                  placeholder="Bosphorus Travel"
                  autoComplete="organization"
                  className="h-auto rounded-2xl border-white/10 bg-[#262a31] px-4 py-4 text-[#dfe2eb] placeholder:text-[#859490] focus-visible:ring-1 focus-visible:ring-[#00f0ff]/50"
                  {...register('name')}
                />
                <div className="absolute bottom-0 left-0 h-px w-0 bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.8)] transition-all duration-500 group-focus-within:w-full" />
              </div>

              {errors.name?.message ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-[#ffb4ab]">
                  {errors.name.message}
                </div>
              ) : null}
            </div>

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
                    placeholder="bosphorus-travel"
                    autoComplete="off"
                    className="h-auto rounded-l-none rounded-r-2xl border-white/10 bg-[#262a31] px-4 py-4 text-[#dfe2eb] placeholder:text-[#859490] focus-visible:ring-1 focus-visible:ring-[#00f0ff]/50"
                    {...register('slug', {
                      onChange: (event) => {
                        const nextValue = event.target.value.trim();
                        const generatedSlug = slugifyWorkspaceName(name ?? '');

                        setIsSlugManuallyEdited(nextValue !== generatedSlug);
                      },
                    })}
                  />
                  <div className="absolute bottom-0 left-0 h-px w-0 bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.8)] transition-all duration-500 group-focus-within:w-full" />
                </div>
              </div>

              <p className="mt-2 text-[10px] text-[#859490] italic">
                Use lowercase letters, numbers, and hyphens only. This URL can
                be shared with teammates.
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
                className="glow-button rounded-2xl bg-[#00f0ff] px-10 py-3 text-sm font-bold tracking-tight text-[#003731] transition-all duration-200 hover:bg-[#00f0ff]/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#003731]/20 border-t-[#003731]" />
                    Creating...
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
          <div className="absolute inset-0 bg-linear-to-t from-[#00f0ff]/10 to-transparent" />
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
