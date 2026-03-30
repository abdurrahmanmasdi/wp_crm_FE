'use client';

import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DashboardLeadsByStage } from '@/lib/api/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type LeadsByStageChartProps = {
  data: DashboardLeadsByStage[];
};

/**
 * Displays lead counts per pipeline stage in a responsive bar chart.
 */
export function LeadsByStageChart({ data }: LeadsByStageChartProps) {
  const t = useTranslations('dashboard');

  return (
    <Card className="bg-card border-white/5 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg">{t('charts_leads_by_stage')}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
            {t('empty_no_stage_data')}
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="stageName"
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
