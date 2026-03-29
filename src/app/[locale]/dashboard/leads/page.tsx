'use client';

import { useCallback, useMemo } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { AddLeadSheet } from '@/components/leads/AddLeadSheet';
import {
  LeadFiltersBar,
  parseLeadFiltersParam,
  serializeLeadFiltersParam,
  type LeadFilterRule,
} from '@/components/leads/filters';
import { LeadsDataTable } from '@/components/leads/LeadsDataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppAction, AppResource } from '@/constants/permissions.registry';
import { useLeads } from '@/hooks/useLeads';
import { getErrorMessage } from '@/lib/error-utils';
import type { Lead } from '@/types/leads';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function parsePositiveQueryNumber(
  value: string | null,
  fallback: number
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export default function LeadsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Leads');

  const filtersParam = searchParams.get('filters');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const currentPage = parsePositiveQueryNumber(pageParam, DEFAULT_PAGE);
  const currentLimit = parsePositiveQueryNumber(limitParam, DEFAULT_LIMIT);

  const initialRules = useMemo(
    () => parseLeadFiltersParam(filtersParam),
    [filtersParam]
  );

  const { organizationId, leadsQuery, deleteLeadMutation } = useLeads({
    filters: filtersParam ?? undefined,
    page: currentPage,
    limit: currentLimit,
  });

  const handleRulesChange = useCallback(
    (rules: LeadFilterRule[]) => {
      const nextFiltersParam = serializeLeadFiltersParam(rules);
      const currentFiltersParam = searchParams.get('filters');

      if ((currentFiltersParam ?? null) === nextFiltersParam) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      if (!nextFiltersParam) {
        nextParams.delete('filters');
      } else {
        nextParams.set('filters', nextFiltersParam);
      }
      nextParams.set('page', '1');

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const parsedPage = Math.max(1, Math.floor(nextPage));

      if (parsedPage === currentPage) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set('page', String(parsedPage));

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [currentPage, pathname, router, searchParams]
  );

  const handleLimitChange = useCallback(
    (nextLimit: number) => {
      const parsedLimit = Math.max(1, Math.floor(nextLimit));

      if (parsedLimit === currentLimit) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set('limit', String(parsedLimit));
      nextParams.set('page', '1');

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [currentLimit, pathname, router, searchParams]
  );

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

  const leads = leadsQuery.data?.data ?? [];
  const paginationMeta = leadsQuery.data?.meta ?? {
    page: currentPage,
    limit: currentLimit,
    total: leads.length,
    totalPages: 1,
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
              {t('label')}
            </p>
            <h1 className="font-headline text-foreground text-2xl font-bold tracking-tight md:text-3xl">
              {t('pageTitle')}
            </h1>
            <p className="text-muted-foreground mt-0.5 max-w-2xl text-sm leading-5">
              {t('pageDescription')}
            </p>
          </div>
        </div>
      </section>

      {!organizationId ? (
        <section className="bg-card rounded-2xl border border-white/5 p-4 shadow-2xl shadow-black/20">
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
        <Tabs
          defaultValue="list"
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          <div className="bg-card rounded-xl border border-white/5 p-2 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center gap-2">
              <TabsList className="bg-background grid h-8 w-auto grid-cols-2 rounded-lg border border-white/5 p-0.5">
                <TabsTrigger
                  value="list"
                  className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-3 py-1.5 text-xs font-semibold"
                >
                  <List className="mr-1.5 h-3.5 w-3.5" />
                  {t('tabs.list')}
                </TabsTrigger>
                <TabsTrigger
                  value="board"
                  className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-3 py-1.5 text-xs font-semibold"
                >
                  <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
                  {t('tabs.board')}
                </TabsTrigger>
              </TabsList>

              <LeadFiltersBar
                className="min-w-0 flex-1"
                initialRules={initialRules}
                onRulesChange={handleRulesChange}
              />

              <RequirePermission
                resource={AppResource.LEADS}
                action={AppAction.CREATE}
                fallback="disable"
              >
                <AddLeadSheet />
              </RequirePermission>
            </div>
          </div>

          <TabsContent
            value="list"
            className="mt-0 flex min-h-0 flex-1 flex-col"
          >
            <LeadsDataTable
              leads={leads}
              isLoading={leadsQuery.isLoading}
              error={leadsQuery.error}
              deletingLeadId={deletingLeadId}
              onDeleteLead={handleDeleteLead}
              pagination={paginationMeta}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </TabsContent>

          <TabsContent
            value="board"
            className="mt-0 flex min-h-0 flex-1 flex-col"
          >
            <section className="bg-card flex min-h-0 flex-1 rounded-2xl border border-white/5 p-4 shadow-2xl shadow-black/20">
              <div className="bg-background flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center">
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
