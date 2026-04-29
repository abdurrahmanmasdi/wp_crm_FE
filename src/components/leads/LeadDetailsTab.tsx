'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import type { Lead } from '@/types/leads-generated';

type LeadDetailsTabProps = {
  lead: Lead;
  sourceName: string;
  assignedAgentName: string;
  localizedCountry: string;
  localizedTimezone: string;
  localizedLanguages: string | null;
  formatEstimatedValue: (value: string, currency: string) => string;
  formatDateTime: (value: Date | string | null) => string | null;
  renderValue: (value: string | null) => string;
};

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

export function LeadDetailsTab({
  lead,
  sourceName,
  assignedAgentName,
  localizedCountry,
  localizedTimezone,
  localizedLanguages,
  formatEstimatedValue,
  formatDateTime,
  renderValue,
}: LeadDetailsTabProps) {
  const t = useTranslations('Leads');

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-foreground text-sm font-semibold">
          {t('detailSheet.sections.sales')}
        </h3>
        <dl className="mt-3 grid grid-cols-2 gap-4">
          <DetailItem
            label={t('detailSheet.fields.estimatedValue')}
            value={formatEstimatedValue(lead.estimated_value, lead.currency)}
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
            value={localizedLanguages || t('notSet')}
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
            value={renderValue(formatDateTime(lead.expected_service_date))}
          />
          <DetailItem
            label={t('detailSheet.fields.createdAt')}
            value={renderValue(formatDateTime(lead.created_at))}
          />
        </dl>
      </div>
    </section>
  );
}
