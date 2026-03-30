'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { DashboardRecentLead } from '@/lib/api/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type RecentActivityFeedProps = {
  leads: DashboardRecentLead[];
};

function formatDate(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function getStatusClass(status: DashboardRecentLead['status']) {
  switch (status) {
    case 'WON':
      return 'bg-emerald-500/15 text-emerald-300';
    case 'LOST':
      return 'bg-rose-500/15 text-rose-300';
    case 'UNQUALIFIED':
      return 'bg-amber-500/15 text-amber-300';
    default:
      return 'bg-primary/15 text-primary';
  }
}

/**
 * Displays a compact timeline of recent leads from analytics payload.
 */
export function RecentActivityFeed({ leads }: RecentActivityFeedProps) {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const displayLeads = leads.slice(0, 5);

  return (
    <Card className="bg-card border-white/5 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg">{t('recent_activity_title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {displayLeads.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center text-sm">
            {t('no_recent_activity')}
          </div>
        ) : (
          <div className="space-y-4">
            {displayLeads.map((lead) => {
              const fullName = `${lead.first_name} ${lead.last_name}`.trim();

              return (
                <article
                  key={lead.id}
                  className="border-border/50 flex items-start gap-3 border-l pl-4"
                >
                  <div className="bg-primary mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-foreground truncate text-sm font-semibold">
                        {fullName.length > 0 ? fullName : t('unknown_lead')}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(lead.status)}`}
                      >
                        {lead.status}
                      </span>
                    </div>

                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDate(lead.created_at, locale)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
