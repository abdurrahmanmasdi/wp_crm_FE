'use client';

import { BadgeDollarSign, Funnel, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import type { DashboardPipelineOverview } from '@/lib/api/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardKPIsProps = {
  pipelineOverview: DashboardPipelineOverview;
};

function getCurrencyForLocale(locale: string): string {
  if (locale.startsWith('tr')) {
    return 'TRY';
  }

  if (locale.startsWith('ar')) {
    return 'SAR';
  }

  return 'USD';
}

function formatCurrency(
  value: number,
  locale: string,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
}

/**
 * Renders high-level analytics KPI cards for leads dashboard overview.
 */
export function DashboardKPIs({ pipelineOverview }: DashboardKPIsProps) {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const currency = getCurrencyForLocale(locale);
  const numberFormatter = new Intl.NumberFormat(locale);

  const cards = [
    {
      title: t('kpi_total_leads'),
      value: numberFormatter.format(pipelineOverview.totalLeads),
      icon: Users,
    },
    {
      title: t('kpi_pipeline_value'),
      value: formatCurrency(
        pipelineOverview.totalPipelineValue,
        locale,
        currency
      ),
      icon: BadgeDollarSign,
    },
    {
      title: t('kpi_active_stages'),
      value: numberFormatter.format(pipelineOverview.leadsByStage.length),
      icon: Funnel,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ title, value, icon: Icon }) => (
        <Card
          key={title}
          className="bg-card border-white/5 shadow-2xl shadow-black/20"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <p className="text-foreground text-3xl font-bold tracking-tight">
                {value}
              </p>
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
