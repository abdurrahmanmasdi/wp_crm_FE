'use client';

import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useOrganizationMembersQuery,
  useUpdateLeadMutation,
} from '@/hooks/useLeads';
import { getErrorMessage } from '@/lib/error-utils';
import type { Lead } from '@/types/leads';

import { LeadDemographicsSection } from './form/LeadDemographicsSection';
import { LeadIdentitySection } from './form/LeadIdentitySection';
import { LeadSalesSection } from './form/LeadSalesSection';
import {
  type AddLeadFormValues,
  createAddLeadSchema,
  defaultValues,
} from './form/form.config';
import { buildLeadFormValues, buildUpdateLeadPayload } from './form/payload';

type EditLeadSheetProps = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditLeadSheet({
  lead,
  open,
  onOpenChange,
}: EditLeadSheetProps) {
  const t = useTranslations('Leads');
  const updateLeadMutation = useUpdateLeadMutation();
  const membersQuery = useOrganizationMembersQuery();

  const schema = useMemo(
    () => createAddLeadSchema((key) => t(key as never)),
    [t]
  );
  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (!open || !lead) {
      return;
    }

    form.reset(buildLeadFormValues(lead));
  }, [form, lead, open]);

  const isSubmitting = updateLeadMutation.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(defaultValues);
    }

    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: AddLeadFormValues) => {
    if (!lead) {
      return;
    }

    try {
      await updateLeadMutation.mutateAsync({
        leadId: lead.id,
        payload: buildUpdateLeadPayload(values),
      });

      toast.success(t('updateSuccess'));
      handleOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error) || t('updateError'));
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t('editSheet.title')}</SheetTitle>
          <SheetDescription>{t('editSheet.description')}</SheetDescription>
        </SheetHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-5"
          >
            <Tabs defaultValue="core" className="space-y-4">
              <TabsList className="bg-background grid h-auto w-full grid-cols-2 rounded-lg border border-white/10 p-1">
                <TabsTrigger value="core">
                  {t('form.sections.core')}
                </TabsTrigger>
                <TabsTrigger value="advanced">
                  {t('form.sections.advanced')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="core" className="mt-0 space-y-5">
                <LeadIdentitySection disabled={isSubmitting} />
                <LeadDemographicsSection disabled={isSubmitting} />
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 space-y-5">
                <LeadSalesSection
                  assignedAgentOptions={membersQuery.data ?? []}
                  isAgentsLoading={membersQuery.isLoading}
                  disabled={isSubmitting}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 border-t pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('form.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || !lead}>
                {isSubmitting
                  ? t('editSheet.submitting')
                  : t('editSheet.submit')}
              </Button>
            </div>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
