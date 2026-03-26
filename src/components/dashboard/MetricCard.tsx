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
      ? 'text-primary'
      : trendDirection === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <article className="bg-card hover:border-primary/15 relative overflow-hidden rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="bg-primary/5 absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
            {title}
          </p>
          <h3 className="text-foreground mt-3 text-4xl font-bold tracking-tight">
            {value}
          </h3>
        </div>

        <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_0_18px_var(--glow-primary-sm)]">
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
