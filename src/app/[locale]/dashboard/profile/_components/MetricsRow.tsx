'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, Users } from 'lucide-react';
import type { UsersControllerGetPerformanceProfileV1200 } from '@/api-generated/model';

interface MetricsData {
  closed_revenue_mtd?: number;
  active_pipeline_value?: number;
}

interface MembershipData {
  monthly_revenue_target?: number;
  max_active_leads?: number;
}

interface MetricsRowProps {
  data: UsersControllerGetPerformanceProfileV1200;
}

/**
 * Simple Progress Bar Component
 * Used to show progress toward monthly target
 */
function ProgressBar({
  current,
  target,
  className = '',
}: {
  current: number;
  target: number;
  className?: string;
}) {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const clampedPercentage = Math.min(percentage, 100);

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}
    >
      <div
        className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-300"
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
}

/**
 * Format currency value
 */
function formatCurrency(value?: number, currency = 'USD'): string {
  if (!value) return `$0`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * MetricsRow Component
 * Displays three metric cards: Earnings, Pipeline, and Lead Capacity
 */
export function MetricsRow({ data }: MetricsRowProps) {
  const t = useTranslations();

  const metrics = data?.metrics as MetricsData | undefined;
  const membership = data?.membership as MembershipData | undefined;

  // Extract metric values
  const closedRevenueMtd = metrics?.closed_revenue_mtd || 0;
  const activePipelineValue = metrics?.active_pipeline_value || 0;
  const monthlyRevenueTarget = membership?.monthly_revenue_target || 0;
  const maxActiveLeads = membership?.max_active_leads || 0;

  // Calculate progress percentage for revenue target
  const revenueProgressPercent =
    monthlyRevenueTarget <= 0
      ? 0
      : Math.min((closedRevenueMtd / monthlyRevenueTarget) * 100, 100);

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Card 1: Earnings - Closed This Month */}
      <Card className="border-border bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase">
              {t('dashboard.profile.earnings_title')}
            </CardTitle>
            <div className="rounded-lg bg-green-500/10 p-2 text-green-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Value */}
          <div>
            <p className="text-3xl font-bold">
              {formatCurrency(closedRevenueMtd)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t('dashboard.profile.of')} {formatCurrency(monthlyRevenueTarget)}{' '}
              {t('dashboard.profile.target')}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <ProgressBar
              current={closedRevenueMtd}
              target={monthlyRevenueTarget}
            />
            <p className="text-muted-foreground text-right text-xs">
              {Math.round(revenueProgressPercent)}%{' '}
              {t('dashboard.profile.complete')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Pipeline - Money on the Table */}
      <Card className="border-border bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase">
              {t('dashboard.profile.pipeline_title')}
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {formatCurrency(activePipelineValue)}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {t('dashboard.profile.active_opportunities')}
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Lead Capacity */}
      <Card className="border-border bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase">
              {t('dashboard.profile.capacity_title')}
            </CardTitle>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{maxActiveLeads}</p>
          <p className="text-muted-foreground mt-2 text-xs">
            {t('dashboard.profile.max_leads')}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
