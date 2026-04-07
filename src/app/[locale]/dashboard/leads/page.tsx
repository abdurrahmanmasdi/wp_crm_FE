'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { AddLeadSheet } from '@/components/leads/AddLeadSheet';
import { useLeadTableActions } from '@/components/leads/table/useLeadTableActions';
import {
  parseLeadFiltersParam,
  serializeLeadFiltersParam,
  type LeadFilterRule,
} from '@/components/leads/filters';
import { LeadsDataTable } from '@/components/leads/LeadsDataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppAction, AppResource } from '@/constants/permissions.registry';
import { usePipelineStagesQuery } from '@/hooks/useCrmSettings';
import { useDebounce } from '@/hooks/useDebounce';
import { useLeads } from '@/hooks/useLeads';
import { getErrorMessage } from '@/lib/error-utils';
import type { Lead, LeadSortBy, LeadSortDir } from '@/types/leads';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const SEARCH_ROUTER_REPLACE_DELAY_MS = 1000;
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
  const { handleExportCsv: handleTableExportCsv, isExporting } =
    useLeadTableActions();

  const filtersParam = searchParams.get('filters');
  const searchParam = searchParams.get('search') ?? '';
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const sortByParam = parseSortBy(searchParams.get('sortBy'));
  const sortDirParam = parseSortDir(searchParams.get('sortDir'));
  const currentPage = parsePositiveQueryNumber(pageParam, DEFAULT_PAGE);
  const currentLimit = parsePositiveQueryNumber(limitParam, DEFAULT_LIMIT);
  const [searchInput, setSearchInput] = useState(searchParam);
  const searchReplaceTimeoutRef = useRef<number | null>(null);
  const debouncedSearch = useDebounce(searchInput, 500);

  const initialRules = useMemo(
    () => parseLeadFiltersParam(filtersParam),
    [filtersParam]
  );

  const { organizationId, leadsQuery, deleteLeadMutation } = useLeads(
    {
      filters: filtersParam ?? undefined,
      page: currentPage,
      limit: currentLimit,
      sortBy: sortByParam,
      sortDir: sortDirParam,
    },
    debouncedSearch
  );
  const pipelineStagesQuery = usePipelineStagesQuery();

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    return () => {
      if (searchReplaceTimeoutRef.current !== null) {
        window.clearTimeout(searchReplaceTimeoutRef.current);
      }
    };
  }, []);

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

  const handleSearchChange = useCallback(
    (nextValue: string) => {
      setSearchInput(nextValue);

      if (searchReplaceTimeoutRef.current !== null) {
        window.clearTimeout(searchReplaceTimeoutRef.current);
      }

      searchReplaceTimeoutRef.current = window.setTimeout(() => {
        const nextParams = new URLSearchParams(window.location.search);
        const normalizedSearch = nextValue.trim();

        if (!normalizedSearch) {
          nextParams.delete('search');
        } else {
          nextParams.set('search', normalizedSearch);
        }

        nextParams.set('page', '1');

        const nextQuery = nextParams.toString();
        const currentQuery = window.location.search.replace(/^\?/, '');

        if (nextQuery === currentQuery) {
          return;
        }

        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
          scroll: false,
        });
      }, SEARCH_ROUTER_REPLACE_DELAY_MS);
    },
    [pathname, router]
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

    await handleTableExportCsv({
      organizationId,
      filters: filtersParam ?? undefined,
      search: searchParam || undefined,
      sortBy: sortByParam,
      sortDir: sortDirParam,
    });
  }, [
    filtersParam,
    handleTableExportCsv,
    isExporting,
    organizationId,
    searchParam,
    sortByParam,
    sortDirParam,
  ]);

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
              searchValue={searchInput}
              onSearchChange={handleSearchChange}
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
