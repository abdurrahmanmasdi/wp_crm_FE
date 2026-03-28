'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { AddLeadSheet } from '@/components/leads/AddLeadSheet';
import { LeadsDataTable } from '@/components/leads/LeadsDataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppAction, AppResource } from '@/constants/permissions.registry';
import { useLeads } from '@/hooks/useLeads';
import { getErrorMessage } from '@/lib/error-utils';
import type { Lead } from '@/types/leads';

export default function LeadsPage() {
  const t = useTranslations('Leads');
  const { organizationId, leadsQuery, deleteLeadMutation } = useLeads();

  const handleDeleteLead = async (lead: Lead) => {
    try {
      await deleteLeadMutation.mutateAsync(lead.id);
      toast.success(t('deletedSuccess'));
    } catch (error) {
      toast.error(getErrorMessage(error) || t('deletedError'));
    }
  };

  const deletingLeadId =
    deleteLeadMutation.isPending &&
    typeof deleteLeadMutation.variables === 'string'
      ? deleteLeadMutation.variables
      : null;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
              {t('label')}
            </p>
            <h1 className="font-headline text-foreground text-3xl font-bold tracking-tight md:text-4xl">
              {t('pageTitle')}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6 md:text-base">
              {t('pageDescription')}
            </p>
          </div>

          <RequirePermission
            resource={AppResource.LEADS}
            action={AppAction.CREATE}
            fallback="disable"
          >
            <AddLeadSheet />
          </RequirePermission>
        </div>
      </section>

      {!organizationId ? (
        <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
          <div className="bg-background rounded-xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-foreground text-sm font-semibold">
              {t('missingOrganizationTitle')}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('missingOrganizationDescription')}
            </p>
          </div>
        </section>
      ) : (
        <Tabs defaultValue="list" className="space-y-6">
          <div className="bg-card rounded-[1.5rem] border border-white/5 p-2 shadow-2xl shadow-black/20">
            <TabsList className="bg-background grid h-auto w-full grid-cols-2 rounded-[1.2rem] border border-white/5 p-1">
              <TabsTrigger
                value="list"
                className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:shadow-[0_12px_30px_var(--glow-primary-lg)]"
              >
                <List className="mr-2 h-4 w-4" />
                {t('tabs.list')}
              </TabsTrigger>
              <TabsTrigger
                value="board"
                className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:shadow-[0_12px_30px_var(--glow-primary-lg)]"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                {t('tabs.board')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="mt-0">
            <LeadsDataTable
              leads={leadsQuery.data ?? []}
              isLoading={leadsQuery.isLoading}
              error={leadsQuery.error}
              deletingLeadId={deletingLeadId}
              onDeleteLead={handleDeleteLead}
            />
          </TabsContent>

          <TabsContent value="board" className="mt-0">
            <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
              <div className="bg-background rounded-xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-foreground text-sm font-semibold">
                  {t('boardTitle')}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t('boardDescription')}
                </p>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
