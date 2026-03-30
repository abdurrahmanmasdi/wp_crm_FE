'use client';

import dynamic from 'next/dynamic';

function ChartLoadingSkeleton() {
  return (
    <div className="border-muted h-[360px] w-full animate-pulse rounded-xl border-2 border-dashed" />
  );
}

export const LeadsByStageChart = dynamic(
  () => import('./LeadsByStageChart').then((mod) => mod.LeadsByStageChart),
  {
    ssr: false,
    loading: () => <ChartLoadingSkeleton />,
  }
);

export const LeadsBySourceChart = dynamic(
  () => import('./LeadsBySourceChart').then((mod) => mod.LeadsBySourceChart),
  {
    ssr: false,
    loading: () => <ChartLoadingSkeleton />,
  }
);
