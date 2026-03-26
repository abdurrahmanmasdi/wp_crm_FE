'use client';

import axios from 'axios';
import { MailPlus, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { LoadingSpinner } from '@/components/onboarding/loading-spinner';
import { OnboardingFooter } from '@/components/onboarding/onboarding-footer';
import { OnboardingHeader } from '@/components/layout/OnboardingHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { orgService } from '@/lib/org.service';
import { useAuthStore } from '@/store/useAuthStore';

const inviteSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  role: z.enum(['agent', 'manager']),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

type InvitedMember = {
  email: string;
  role: string;
  initials: string;
  gradientClassName: string;
};

const pastelGradients = [
  'from-[#f9a8d4] to-[#c084fc]',
  'from-[#fdba74] to-[#fb7185]',
  'from-[#93c5fd] to-[#60a5fa]',
  'from-[#86efac] to-[#34d399]',
] as const;

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

function buildInitials(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

function getAvatarGradient(index: number) {
  return pastelGradients[index % pastelGradients.length];
}

export default function InviteTeamPage() {
  const router = useRouter();
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [invitedMembers, setInvitedMembers] = useState<InvitedMember[]>([]);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'agent',
    },
  });

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    if (activeOrganizationId == null) {
      router.push('/onboarding/create');
      return;
    }

    if (user == null) {
      router.push('/auth/login');
    }
  }, [_hasHydrated, activeOrganizationId, router, user]);

  const invitedCountLabel = useMemo(() => {
    return invitedMembers.length === 1
      ? '1 invited teammate'
      : `${invitedMembers.length} invited teammates`;
  }, [invitedMembers.length]);

  const onSubmit = async (values: InviteFormValues) => {
    if (!activeOrganizationId) {
      router.push('/onboarding/create');
      return;
    }

    setSubmitError('');

    try {
      await orgService.inviteTeamMember(activeOrganizationId, {
        email: values.email.trim(),
        role: values.role,
      });

      const email = values.email.trim();

      setInvitedMembers((currentMembers) => [
        ...currentMembers,
        {
          email,
          role: values.role,
          initials: buildInitials(email),
          gradientClassName: getAvatarGradient(currentMembers.length),
        },
      ]);

      reset({ email: '', role: values.role });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  if (!_hasHydrated || user == null || activeOrganizationId == null) {
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
                Step 2 of 3: Your Crew
              </span>
              <span className="font-body text-muted-foreground text-sm font-medium">
                Invite Team
              </span>
            </div>

            <div className="bg-secondary h-1 w-full overflow-hidden rounded-full">
              <div className="bg-primary h-full w-2/3 shadow-[0_0_10px_var(--glow-primary-xxl)]" />
            </div>
          </div>
        </div>

        <section className="bg-card relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/30 md:p-12">
          <div className="bg-primary/5 absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl" />

          <header className="mb-10 space-y-3 text-center sm:text-left">
            <div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Team invites
            </div>
            <h1 className="font-headline text-foreground text-3xl font-bold tracking-tight md:text-4xl">
              Bring your crew on board
            </h1>
            <p className="text-muted-foreground text-base leading-6">
              Invite agents and managers now, or continue to preferences and do
              it later.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex items-end gap-2 max-md:flex-col">
              <div className="w-full space-y-2">
                <label
                  className="font-label text-muted-foreground block text-xs font-bold tracking-widest uppercase"
                  htmlFor="email"
                >
                  Team Member Email
                </label>

                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@agency.com"
                  autoComplete="off"
                  className="bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 h-12 rounded-full border-white/10 px-6 focus-visible:ring-1"
                  {...register('email')}
                />

                {errors.email?.message ? (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="w-full">
                <label
                  className="font-label text-muted-foreground mb-2 block text-xs font-bold tracking-widest uppercase"
                  htmlFor="role"
                >
                  Role
                </label>

                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="role"
                        className="h-12 rounded-full px-6"
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex w-full items-end max-md:mt-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-full px-8 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="border-primary-foreground/20 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      Invite
                      <MailPlus className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {submitError ? (
              <div className="text-destructive rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm">
                {submitError}
              </div>
            ) : null}
          </form>

          <div className="mt-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground/70 text-[11px] font-bold tracking-[0.2em] uppercase">
                Invited List
              </h3>
              <span className="text-primary text-[11px] font-semibold tracking-widest uppercase">
                {invitedCountLabel}
              </span>
            </div>

            <div className="space-y-3">
              {invitedMembers.length === 0 ? (
                <div className="bg-background/60 text-muted-foreground rounded-2xl border border-dashed border-white/10 px-5 py-6 text-sm">
                  No invitations yet. Use the form above to start building your
                  team.
                </div>
              ) : (
                invitedMembers.map((member) => (
                  <div
                    key={member.email}
                    className="bg-background/70 hover:bg-secondary flex items-center justify-between rounded-2xl p-4 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br ${member.gradientClassName} text-sm font-bold text-white shadow-sm`}
                      >
                        {member.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-foreground text-sm font-semibold">
                          {member.email}
                        </span>
                        <span className="text-primary/80 text-[10px] font-bold tracking-wider uppercase">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${member.email}`}
                      className="text-muted-foreground hover:text-destructive rounded-full p-2 transition-colors hover:bg-red-500/10"
                      onClick={() => {
                        setInvitedMembers((currentMembers) =>
                          currentMembers.filter(
                            (currentMember) =>
                              currentMember.email !== member.email
                          )
                        );
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-12 flex items-center justify-end gap-4 border-t border-white/10 pt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/onboarding/preferences')}
              className="text-muted-foreground hover:text-foreground rounded-full px-6 py-3 text-sm font-semibold tracking-wide hover:bg-white/5"
            >
              Skip for now
            </Button>

            <Button
              type="button"
              onClick={() => router.push('/onboarding/preferences')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-3 text-sm font-bold"
            >
              Continue
            </Button>
          </div>
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
