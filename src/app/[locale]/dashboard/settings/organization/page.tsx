'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { Button } from '@/components/ui/button';
import { AppResource } from '@/constants/permissions.registry';

import { useOrganizationSettings } from './_hooks/useOrganizationSettings';
import { BankAccountsSection } from './_components/BankAccountsSection';
import { BillingSection } from './_components/BillingSection';
import { BrandingSection } from './_components/BrandingSection';
import { ContactLocalizationSection } from './_components/ContactLocalizationSection';
import { LegalBusinessSection } from './_components/LegalBusinessSection';
import { LegalDocumentsSection } from './_components/LegalDocumentsSection';
import { SocialLinksSection } from './_components/SocialLinksSection';

function OrganizationSettingsForm() {
  const { form, isLoading, isError, isSaving, onSubmit, onRetry, onDiscard } =
    useOrganizationSettings();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">
            Failed to load organization
          </p>
          <p className="text-on-surface-variant mt-1 text-sm">
            We couldn&apos;t fetch your organization data. Please check your
            connection and try again.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 text-white hover:bg-white/10"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen">
        <Form {...form}>
          <div className="mx-auto space-y-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <LegalBusinessSection control={form.control} />

                <div className="space-y-8 lg:col-span-4">
                  <BrandingSection control={form.control} />
                  <BillingSection />
                </div>

                <ContactLocalizationSection control={form.control} />
                <LegalDocumentsSection />
              </div>
              <div className="flex flex-col justify-end gap-4 sm:flex-row sm:items-center">
                <div className="my-4 flex items-center gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-on-surface-variant hover:text-on-surface"
                    disabled={!form.formState.isDirty || isSaving}
                    onClick={onDiscard}
                  >
                    Discard Changes
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="text-on-primary px-10 py-3 text-sm font-bold tracking-widest uppercase"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Workspace Configuration'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Form>

        {/* Standalone CRUDS are rendered outside the master tracking form */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <BankAccountsSection />
          <SocialLinksSection />
        </div>
      </main>
    </>
  );
}

export default function OrganizationPage() {
  return (
    <RequirePermission resource={AppResource.ORGANIZATION} fallback="hide">
      <OrganizationSettingsForm />
    </RequirePermission>
  );
}
