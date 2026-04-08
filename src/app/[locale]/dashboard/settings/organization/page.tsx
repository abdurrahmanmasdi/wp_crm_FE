'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('Settings.OrganizationSettings');
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="mx-auto">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <LegalBusinessSection control={form.control} />

                <div className="space-y-8 lg:col-span-4">
                  <BrandingSection control={form.control} />
                  <BillingSection />
                </div>

                <ContactLocalizationSection control={form.control} />
                <LegalDocumentsSection />
              </div>
            </div>

            {/* Sticky Save Bar */}
            <div className="border-border bg-background/80 sticky bottom-0 z-40 flex w-full items-center justify-end gap-4 border-t p-4 backdrop-blur-md">
              <Button
                type="button"
                variant="ghost"
                className="text-on-surface-variant hover:text-on-surface"
                disabled={!form.formState.isDirty || isSaving}
                onClick={onDiscard}
              >
                {t('discardChanges')}
              </Button>

              <Button
                type="submit"
                disabled={isSaving}
                className="text-on-primary px-10 py-3 text-sm font-bold tracking-widest uppercase"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('savingText')}
                  </>
                ) : (
                  t('saveWorkspaceConfiguration')
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Standalone CRUDS Section */}
        <div className="mx-auto">
          <hr className="border-border my-8" />
          <h3 className="text-lg font-semibold">{t('standaloneSettings')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('standaloneSettingsDescription')}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <BankAccountsSection />
            <SocialLinksSection />
          </div>
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
