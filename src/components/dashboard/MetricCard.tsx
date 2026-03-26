import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type MetricCardProps = {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
};

export function MetricCard({
  title,
  value,
  trend,
  trendDirection = 'neutral',
  icon,
}: MetricCardProps) {
  const trendClassName =
    trendDirection === 'up'
      ? 'text-[#57f1db]'
      : trendDirection === 'down'
        ? 'text-[#ffb4ab]'
        : 'text-[#859490]';

  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#161b22] p-6 shadow-2xl shadow-black/20 transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#00f0ff]/15">
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#00f0ff]/5 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#bacac5] uppercase">
            {title}
          </p>
          <h3 className="mt-3 text-4xl font-bold tracking-tight text-[#dfe2eb]">
            {value}
          </h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00f0ff]/10 text-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.08)]">
          {icon}
        </div>
      </div>

      {trend ? (
        <p className={cn('mt-4 text-sm font-semibold', trendClassName)}>
          {trend}
        </p>
      ) : null}
    </article>
  );
}
