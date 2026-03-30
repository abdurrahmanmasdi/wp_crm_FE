'use client';

import { useCallback, useMemo, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { AddLeadSheet } from '@/components/leads/AddLeadSheet';
import {
  parseLeadFiltersParam,
  serializeLeadFiltersParam,
  type LeadFilterRule,
} from '@/components/leads/filters';
import { LeadsDataTable } from '@/components/leads/LeadsDataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppAction, AppResource } from '@/constants/permissions.registry';
import { usePipelineStagesQuery } from '@/hooks/useCrmSettings';
import { useLeads } from '@/hooks/useLeads';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-utils';
import type {
  Lead,
  LeadsListResponse,
  LeadSortBy,
  LeadSortDir,
} from '@/types/leads';
import { exportLeadsToCSV } from '@/utils/csv-export';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const SORTABLE_FIELDS: LeadSortBy[] = [
  'first_name',
  'status',
  'priority',
  'estimated_value',
  'created_at',
];

const LeadsKanbanBoard = dynamic(
  () =>
    import('@/components/leads/board/LeadsKanbanBoard').then(
      (mod) => mod.LeadsKanbanBoard
    ),
  {
    loading: () => (
      <div className="border-muted h-[600px] w-full animate-pulse rounded-xl border-2 border-dashed" />
    ),
    ssr: false,
  }
);

function parseSortBy(value: string | null): LeadSortBy | undefined {
  if (!value) {
    return undefined;
  }

  return SORTABLE_FIELDS.includes(value as LeadSortBy)
    ? (value as LeadSortBy)
    : undefined;
}

function parseSortDir(value: string | null): LeadSortDir | undefined {
  if (!value) {
    return undefined;
  }

  return value === 'asc' || value === 'desc' ? value : undefined;
}

type LeadsExportResponse =
  | Lead[]
  | Pick<LeadsListResponse, 'data'>
  | { items?: Lead[]; leads?: Lead[] };

function extractLeadsFromResponse(data: LeadsExportResponse): Lead[] {
  if (Array.isArray(data)) {
    return data;
  }

  const record = data as {
    data?: Lead[];
    items?: Lead[];
    leads?: Lead[];
  };

  if (Array.isArray(record.data)) {
    return record.data;
  }

  if (Array.isArray(record.items)) {
    return record.items;
  }

  if (Array.isArray(record.leads)) {
    return record.leads;
  }

  return [];
}

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
  const [isExporting, setIsExporting] = useState(false);

  const filtersParam = searchParams.get('filters');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const sortByParam = parseSortBy(searchParams.get('sortBy'));
  const sortDirParam = parseSortDir(searchParams.get('sortDir'));
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
    sortBy: sortByParam,
    sortDir: sortDirParam,
  });
  const pipelineStagesQuery = usePipelineStagesQuery();

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

  const handleSortChange = useCallback(
    (nextSortBy?: LeadSortBy, nextSortDir?: LeadSortDir) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (!nextSortBy || !nextSortDir) {
        nextParams.delete('sortBy');
        nextParams.delete('sortDir');
      } else {
        nextParams.set('sortBy', nextSortBy);
        nextParams.set('sortDir', nextSortDir);
      }

      nextParams.set('page', '1');

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handleDeleteLead = async (lead: Lead) => {
    try {
      await deleteLeadMutation.mutateAsync(lead.id);
      toast.success(t('deletedSuccess'));
    } catch (error) {
      toast.error(getErrorMessage(error) || t('deletedError'));
    }
  };

  const handleExportCsv = useCallback(async () => {
    if (!organizationId || isExporting) {
      return;
    }

    const exportParams = new URLSearchParams(searchParams.toString());
    exportParams.set('page', '1');
    exportParams.set('limit', '5000');

    try {
      setIsExporting(true);

      const { data } = await api.get<LeadsExportResponse>(
        `/organizations/${organizationId}/leads`,
        {
          params: Object.fromEntries(exportParams.entries()),
        }
      );

      const leadsForExport = extractLeadsFromResponse(data);

      if (leadsForExport.length === 0) {
        toast.error(t('export.empty'));
        return;
      }

      exportLeadsToCSV(leadsForExport);
      toast.success(
        t('export.success', {
          count: leadsForExport.length,
        })
      );
    } catch (error) {
      toast.error(getErrorMessage(error) || t('export.error'));
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, organizationId, searchParams, t]);

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
            <div className="flex flex-wrap items-center justify-between gap-2">
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
              organizationId={organizationId}
              initialRules={initialRules}
              onRulesChange={handleRulesChange}
              onExportCsv={handleExportCsv}
              isExporting={isExporting}
              deletingLeadId={deletingLeadId}
              onDeleteLead={handleDeleteLead}
              pagination={paginationMeta}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              sortBy={sortByParam}
              sortDir={sortDirParam}
              onSortChange={handleSortChange}
            />
          </TabsContent>

          <TabsContent
            value="board"
            className="mt-0 flex min-h-0 flex-1 flex-col"
          >
            {leadsQuery.isLoading || pipelineStagesQuery.isLoading ? (
              <section className="bg-card flex min-h-0 flex-1 rounded-2xl border border-white/5 p-4 shadow-2xl shadow-black/20">
                <p className="text-muted-foreground text-sm">{t('loading')}</p>
              </section>
            ) : leadsQuery.error || pipelineStagesQuery.error ? (
              <section className="bg-card flex min-h-0 flex-1 rounded-2xl border border-white/5 p-4 shadow-2xl shadow-black/20">
                <div className="bg-background w-full rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <p className="text-destructive text-sm font-semibold">
                    {t('loadErrorTitle')}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {getErrorMessage(
                      leadsQuery.error ?? pipelineStagesQuery.error
                    )}
                  </p>
                </div>
              </section>
            ) : (
              <LeadsKanbanBoard
                leads={leads}
                pipelineStages={pipelineStagesQuery.data ?? []}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
