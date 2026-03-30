'use client';

import { useTranslations } from 'next-intl';

import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import {
  LeadsBySourceChart,
  LeadsByStageChart,
} from '@/components/dashboard/charts/index';
import { useDashboardMetrics } from '@/hooks/useAnalytics';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/useAuthStore';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border-muted h-32 animate-pulse rounded-xl border-2 border-dashed"
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="border-muted h-[360px] animate-pulse rounded-xl border-2 border-dashed" />
        <div className="border-muted h-[360px] animate-pulse rounded-xl border-2 border-dashed" />
      </section>

      <div className="border-muted h-[320px] animate-pulse rounded-xl border-2 border-dashed" />
    </div>
  );
}

export default function DashboardPage() {
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const t = useTranslations('dashboard');
  const navT = useTranslations('Navigation');
  const metricsQuery = useDashboardMetrics(activeOrganizationId ?? '');

  const hasOrganization = Boolean(activeOrganizationId);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
          {navT('dashboard')} {t('title')}
        </p>
        <h1 className="font-headline text-foreground text-3xl font-bold tracking-tight md:text-4xl">
          {t('title')}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6 md:text-base">
          {t('description')}
        </p>
      </section>

      {!hasOrganization ? (
        <section className="bg-card rounded-2xl border border-white/5 p-6 text-center shadow-2xl shadow-black/20">
          <p className="text-muted-foreground text-sm">
            {t('empty_no_organization')}
          </p>
        </section>
      ) : metricsQuery.isLoading ? (
        <DashboardSkeleton />
      ) : metricsQuery.isError || !metricsQuery.data ? (
        <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
          <p className="text-destructive text-sm font-semibold">
            {t('error_load_failed')}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {getErrorMessage(metricsQuery.error)}
          </p>
        </section>
      ) : (
        <>
          <DashboardKPIs
            pipelineOverview={metricsQuery.data.pipelineOverview}
          />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <LeadsByStageChart
              data={metricsQuery.data.pipelineOverview.leadsByStage}
            />
            <LeadsBySourceChart
              data={metricsQuery.data.pipelineOverview.leadsBySource}
            />
          </section>

          <RecentActivityFeed leads={metricsQuery.data.recentLeads} />
        </>
      )}
    </div>
  );
}
