'use client';

import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MetricCard } from '@/components/dashboard/MetricCard';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const t = useTranslations('Dashboard');
  const navT = useTranslations('Navigation');

  const firstName =
    user && typeof user === 'object'
      ? ((user as { firstName?: string; first_name?: string }).firstName ??
        (user as { firstName?: string; first_name?: string }).first_name ??
        'there')
      : 'there';

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
          {navT('dashboard')} {t('overview')}
        </p>
        <h1 className="font-headline text-foreground text-3xl font-bold tracking-tight md:text-4xl">
          {t('welcomeBack', { name: firstName })}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6 md:text-base">
          {t('performanceOverview')}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'activeLeads',
            value: 142,
            trendKey: 'activeLeasTrend',
            trendDirection: 'up' as const,
            icon: <Activity className="h-5 w-5" />,
          },
          {
            title: 'conversionRate',
            value: '24.8%',
            trendKey: 'conversionRateTrend',
            trendDirection: 'up' as const,
            icon: <ArrowUpRight className="h-5 w-5" />,
          },
          {
            title: 'upcomingTours',
            value: 28,
            trendKey: 'upcomingToursTrend',
            trendDirection: 'neutral' as const,
            icon: <CalendarDays className="h-5 w-5" />,
          },
          {
            title: 'revenuePipeline',
            value: '$84.2K',
            trendKey: 'revenuePipelineTrend',
            trendDirection: 'down' as const,
            icon: <ChartColumn className="h-5 w-5" />,
          },
        ].map(({ title, value, trendKey, trendDirection, icon }) => (
          <MetricCard
            key={title}
            title={t(title as never)}
            value={value}
            trend={t(trendKey as never)}
            trendDirection={trendDirection}
            icon={icon}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <article className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-foreground text-lg font-bold tracking-tight">
                {t('bookingVolume')}
              </h2>
              <p className="text-muted-foreground text-xs font-medium">
                {t('bookingAnalyticsText')}
              </p>
            </div>

            <div className="text-muted-foreground rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-widest uppercase">
              {t('live')}
            </div>
          </div>

          <div className="bg-background relative h-72 overflow-hidden rounded-2xl p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--glow-primary-sm),transparent_55%)]" />

            <div className="relative flex h-full items-end gap-3">
              {[48, 65, 42, 80, 70, 92, 76, 88, 60, 84].map((height, index) => (
                <div
                  key={index}
                  className="flex flex-1 flex-col justify-end gap-2"
                >
                  <div
                    className="bg-primary/80 rounded-t-2xl shadow-[0_0_22px_var(--glow-primary-md)]"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="bg-card space-y-6 rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
          <div>
            <h2 className="text-foreground text-lg font-bold tracking-tight">
              {t('recentInquiries')}
            </h2>
            <p className="text-muted-foreground text-xs font-medium">
              {t('recentInquiriesText')}
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                name: t('sampleInquiry1Name'),
                destination: t('sampleInquiry1Destination'),
                value: t('sampleInquiry1Value'),
              },
              {
                name: t('sampleInquiry2Name'),
                destination: t('sampleInquiry2Destination'),
                value: t('sampleInquiry2Value'),
              },
              {
                name: t('sampleInquiry3Name'),
                destination: t('sampleInquiry3Destination'),
                value: t('sampleInquiry3Value'),
              },
            ].map(({ name, destination, value }) => (
              <div
                key={name}
                className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-foreground font-semibold">{name}</p>
                    <p className="text-muted-foreground text-sm">
                      {destination}
                    </p>
                  </div>
                  <p className="text-primary text-sm font-semibold">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-primary/10 bg-primary/5 rounded-2xl border p-5">
            <div className="text-primary mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-semibold tracking-[0.2em] uppercase">
                {t('intelligencePrompt')}
              </p>
            </div>
            <p className="text-foreground text-sm leading-6">
              {t('aiPrediction')}
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
