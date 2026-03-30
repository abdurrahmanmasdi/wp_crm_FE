'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { DashboardLeadsBySource } from '@/lib/api/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SOURCE_COLORS = [
  '#22c55e',
  '#0ea5e9',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#14b8a6',
  '#f43f5e',
  '#84cc16',
];

type LeadsBySourceChartProps = {
  data: DashboardLeadsBySource[];
};

/**
 * Displays lead distribution by source in a responsive donut chart.
 */
export function LeadsBySourceChart({ data }: LeadsBySourceChartProps) {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const numberFormatter = new Intl.NumberFormat(locale);

  return (
    <Card className="bg-card border-white/5 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg">{t('charts_leads_by_source')}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
            {t('empty_no_source_data')}
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="sourceName"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={3}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.sourceId}
                      fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.map((entry, index) => (
            <div
              key={entry.sourceId}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length],
                }}
              />
              <span className="text-muted-foreground truncate">
                {entry.sourceName}
              </span>
              <span className="text-foreground ml-auto font-medium">
                {numberFormatter.format(entry.count)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
