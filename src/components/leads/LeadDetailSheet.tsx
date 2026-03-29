'use client';

import { useMemo, type ReactNode } from 'react';
import { Mail, Phone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  useLeadSourcesQuery,
  usePipelineStagesQuery,
} from '@/hooks/useCrmSettings';
import { useOrganizationMembersQuery } from '@/hooks/useLeads';
import type { Lead } from '@/types/leads';

type LeadDetailSheetProps = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function createDisplayNames(
  locale: string,
  type: 'region' | 'language'
): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type });
  } catch {
    try {
      return new Intl.DisplayNames(['en'], { type });
    } catch {
      return null;
    }
  }
}

function getPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'HOT':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'WARM':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'COLD':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'WON':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'LOST':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'UNQUALIFIED':
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function formatDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
}

function getAgentDisplayName(label: string): string {
  return label.split(' (')[0] || label;
}

function toInitials(firstName: string, lastName: string): string {
  const values = [firstName, lastName]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (values.length === 0) {
    return '?';
  }

  if (values.length === 1) {
    return values[0].slice(0, 2).toUpperCase();
  }

  return `${values[0][0]}${values[1][0]}`.toUpperCase();
}

function formatEstimatedValue(value: string, currency: string): string {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return `${value} ${currency}`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(parsed);
  } catch {
    return `${value} ${currency}`;
  }
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-foreground text-sm font-semibold wrap-break-word">
        {value}
      </dd>
    </div>
  );
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: LeadDetailSheetProps) {
  const locale = useLocale();
  const t = useTranslations('Leads');
  const tTimezones = useTranslations('Timezones');
  const pipelineStagesQuery = usePipelineStagesQuery();
  const leadSourcesQuery = useLeadSourcesQuery();
  const membersQuery = useOrganizationMembersQuery();

  const leadName = useMemo(() => {
    if (!lead) {
      return '';
    }

    return (
      `${lead.first_name} ${lead.last_name}`.trim() || t('unknownLeadName')
    );
  }, [lead, t]);

  const countryDisplayNames = useMemo(
    () => createDisplayNames(locale, 'region'),
    [locale]
  );
  const languageDisplayNames = useMemo(
    () => createDisplayNames(locale, 'language'),
    [locale]
  );

  const pipelineStageLabelMap = useMemo(
    () =>
      new Map(
        (pipelineStagesQuery.data ?? []).map((stage) => [stage.id, stage.name])
      ),
    [pipelineStagesQuery.data]
  );

  const leadSourceLabelMap = useMemo(
    () =>
      new Map(
        (leadSourcesQuery.data ?? []).map((source) => [source.id, source.name])
      ),
    [leadSourcesQuery.data]
  );

  const memberLabelMap = useMemo(
    () =>
      new Map(
        (membersQuery.data ?? []).map((member) => [member.value, member.label])
      ),
    [membersQuery.data]
  );

  const renderValue = (value: string | null) => value || t('notSet');

  if (!lead) {
    return null;
  }

  const unassignedValue = t('detailSheet.values.unassigned');
  const unknownValue = t('detailSheet.values.unknown');

  const pipelineStageName = lead.pipeline_stage_id
    ? (pipelineStageLabelMap.get(lead.pipeline_stage_id) ?? unknownValue)
    : unassignedValue;

  const sourceName = lead.source_id
    ? (leadSourceLabelMap.get(lead.source_id) ?? unknownValue)
    : unassignedValue;

  const assignedAgentName = lead.assigned_agent_id
    ? getAgentDisplayName(
        memberLabelMap.get(lead.assigned_agent_id) ?? unknownValue
      )
    : unassignedValue;

  const localizedCountry = lead.country
    ? (countryDisplayNames?.of(lead.country.toUpperCase()) ?? unknownValue)
    : t('notSet');

  const localizedPrimaryLanguage = lead.primary_language
    ? (languageDisplayNames?.of(lead.primary_language.toLowerCase()) ??
      unknownValue)
    : t('notSet');

  const localizedPreferredLanguage = lead.preferred_language
    ? (languageDisplayNames?.of(lead.preferred_language.toLowerCase()) ??
      unknownValue)
    : null;

  const localizedLanguages = localizedPreferredLanguage
    ? `${localizedPrimaryLanguage} / ${localizedPreferredLanguage}`
    : localizedPrimaryLanguage;

  const localizedTimezone = lead.timezone
    ? (() => {
        try {
          return tTimezones(lead.timezone as never);
        } catch {
          return lead.timezone;
        }
      })()
    : t('notSet');

  const initials = toInitials(lead.first_name, lead.last_name);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <div className="mt-6 space-y-6">
          <section className="bg-card rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-white/15">
                <AvatarFallback className="text-base font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h2 className="text-foreground truncate text-2xl font-bold">
                  {leadName}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t('detailSheet.description')}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge className={getStatusBadgeClass(lead.status)}>
                    {t(`status.${lead.status}` as never)}
                  </Badge>
                  <Badge className={getPriorityBadgeClass(lead.priority)}>
                    {t(`priority.${lead.priority}` as never)}
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-muted/40 rounded-xl border border-white/10 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {lead.phone_number ? (
                <a
                  href={`tel:${lead.phone_number}`}
                  className="text-foreground hover:text-primary inline-flex items-center gap-2 text-sm font-medium"
                >
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <span>{lead.phone_number}</span>
                </a>
              ) : (
                <div className="text-foreground inline-flex items-center gap-2 text-sm font-medium">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <span>{t('notSet')}</span>
                </div>
              )}

              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-foreground hover:text-primary inline-flex items-center gap-2 text-sm font-medium"
                >
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span>{lead.email}</span>
                </a>
              ) : (
                <div className="text-foreground inline-flex items-center gap-2 text-sm font-medium">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span>{t('notSet')}</span>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-foreground text-sm font-semibold">
                {t('detailSheet.sections.sales')}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-4">
                <DetailItem
                  label={t('detailSheet.fields.estimatedValue')}
                  value={formatEstimatedValue(
                    lead.estimated_value,
                    lead.currency
                  )}
                />
                <DetailItem
                  label={t('detailSheet.fields.pipelineStage')}
                  value={pipelineStageName}
                />
                <DetailItem
                  label={t('detailSheet.fields.source')}
                  value={sourceName}
                />
                <DetailItem
                  label={t('detailSheet.fields.assignedAgent')}
                  value={assignedAgentName}
                />
              </dl>
            </div>

            <div className="border-border/70 border-t" />

            <div>
              <h3 className="text-foreground text-sm font-semibold">
                {t('detailSheet.sections.demographics')}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-4">
                <DetailItem
                  label={t('detailSheet.fields.country')}
                  value={localizedCountry}
                />
                <DetailItem
                  label={t('detailSheet.fields.timezone')}
                  value={localizedTimezone}
                />
                <DetailItem
                  label={t('detailSheet.fields.languages')}
                  value={localizedLanguages}
                />
                <DetailItem
                  label={t('detailSheet.fields.gender')}
                  value={t(`gender.${lead.gender}` as never)}
                />
              </dl>
            </div>

            <div className="border-border/70 border-t" />

            <div>
              <h3 className="text-foreground text-sm font-semibold">
                {t('detailSheet.sections.timeline')}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-4">
                <DetailItem
                  label={t('detailSheet.fields.expectedServiceDate')}
                  value={renderValue(
                    formatDateTime(lead.expected_service_date)
                  )}
                />
                <DetailItem
                  label={t('detailSheet.fields.createdAt')}
                  value={renderValue(formatDateTime(lead.created_at))}
                />
              </dl>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
