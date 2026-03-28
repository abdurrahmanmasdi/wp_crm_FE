'use client';

import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCreateLeadMutation,
  useOrganizationMembersQuery,
} from '@/hooks/useLeads';
import { getErrorMessage } from '@/lib/error-utils';

import { LeadDemographicsSection } from './form/LeadDemographicsSection';
import { LeadIdentitySection } from './form/LeadIdentitySection';
import { LeadSalesSection } from './form/LeadSalesSection';
import {
  type AddLeadFormValues,
  createAddLeadSchema,
  defaultValues,
} from './form/form.config';
import { buildCreateLeadPayload } from './form/payload';

type AddLeadSheetProps = {
  disabled?: boolean;
};

export function AddLeadSheet({ disabled = false }: AddLeadSheetProps) {
  const t = useTranslations('Leads');
  const createLeadMutation = useCreateLeadMutation();
  const membersQuery = useOrganizationMembersQuery();
  const [open, setOpen] = useState(false);

  const schema = useMemo(
    () => createAddLeadSchema((key) => t(key as never)),
    [t]
  );
  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const isSubmitting = createLeadMutation.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(defaultValues);
    }
    setOpen(nextOpen);
  };

  const onSubmit = async (values: AddLeadFormValues) => {
    try {
      await createLeadMutation.mutateAsync(buildCreateLeadPayload(values));

      toast.success(t('createSuccess'));
      form.reset(defaultValues);
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error) || t('createError'));
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button type="button" disabled={disabled}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addLead')}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t('form.title')}</SheetTitle>
          <SheetDescription>{t('form.description')}</SheetDescription>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('form.submitting') : t('form.submit')}
              </Button>
            </div>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
