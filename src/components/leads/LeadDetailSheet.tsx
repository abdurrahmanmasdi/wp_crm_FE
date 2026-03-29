'use client';

import { useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Lead } from '@/types/leads';

type LeadDetailSheetProps = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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
      <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-foreground text-sm wrap-break-word">{value}</dd>
    </div>
  );
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: LeadDetailSheetProps) {
  const t = useTranslations('Leads');

  const leadName = useMemo(() => {
    if (!lead) {
      return '';
    }

    return (
      `${lead.first_name} ${lead.last_name}`.trim() || t('unknownLeadName')
    );
  }, [lead, t]);

  const socialLinks = useMemo(() => {
    if (!lead?.social_links || typeof lead.social_links !== 'object') {
      return [] as Array<[string, string]>;
    }

    return Object.entries(lead.social_links).filter(
      (entry): entry is [string, string] => {
        return typeof entry[1] === 'string' && entry[1].trim().length > 0;
      }
    );
  }, [lead]);

  const renderValue = (value: string | null) => value || t('notSet');

  if (!lead) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{leadName}</SheetTitle>
          <SheetDescription>{t('detailSheet.description')}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <section className="bg-card rounded-xl border border-white/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getStatusBadgeClass(lead.status)}>
                {t(`status.${lead.status}` as never)}
              </Badge>
              <Badge className={getPriorityBadgeClass(lead.priority)}>
                {t(`priority.${lead.priority}` as never)}
              </Badge>
            </div>
          </section>

          <section className="bg-card rounded-xl border border-white/10 p-4">
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              {t('detailSheet.sections.identity')}
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label={t('detailSheet.fields.firstName')}
                value={renderValue(lead.first_name)}
              />
              <DetailItem
                label={t('detailSheet.fields.lastName')}
                value={renderValue(lead.last_name)}
              />
              <DetailItem
                label={t('detailSheet.fields.nativeName')}
                value={renderValue(lead.native_name)}
              />
              <DetailItem
                label={t('detailSheet.fields.gender')}
                value={t(`gender.${lead.gender}` as never)}
              />
            </dl>
          </section>

          <section className="bg-card rounded-xl border border-white/10 p-4">
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              {t('detailSheet.sections.contact')}
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label={t('detailSheet.fields.email')}
                value={renderValue(lead.email)}
              />
              <DetailItem
                label={t('detailSheet.fields.phoneNumber')}
                value={renderValue(lead.phone_number)}
              />
              <DetailItem
                label={t('detailSheet.fields.socialLinks')}
                value={
                  socialLinks.length === 0 ? (
                    t('notSet')
                  ) : (
                    <div className="space-y-1">
                      {socialLinks.map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary block text-sm underline-offset-2 hover:underline"
                        >
                          {platform}: {url}
                        </a>
                      ))}
                    </div>
                  )
                }
              />
            </dl>
          </section>

          <section className="bg-card rounded-xl border border-white/10 p-4">
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              {t('detailSheet.sections.localization')}
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label={t('detailSheet.fields.country')}
                value={renderValue(lead.country)}
              />
              <DetailItem
                label={t('detailSheet.fields.timezone')}
                value={renderValue(lead.timezone)}
              />
              <DetailItem
                label={t('detailSheet.fields.primaryLanguage')}
                value={renderValue(lead.primary_language)}
              />
              <DetailItem
                label={t('detailSheet.fields.preferredLanguage')}
                value={renderValue(lead.preferred_language)}
              />
            </dl>
          </section>

          <section className="bg-card rounded-xl border border-white/10 p-4">
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              {t('detailSheet.sections.sales')}
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label={t('detailSheet.fields.pipelineStageId')}
                value={renderValue(lead.pipeline_stage_id)}
              />
              <DetailItem
                label={t('detailSheet.fields.sourceId')}
                value={renderValue(lead.source_id)}
              />
              <DetailItem
                label={t('detailSheet.fields.assignedAgentId')}
                value={renderValue(lead.assigned_agent_id)}
              />
              <DetailItem
                label={t('detailSheet.fields.estimatedValue')}
                value={formatEstimatedValue(
                  lead.estimated_value,
                  lead.currency
                )}
              />
              <DetailItem
                label={t('detailSheet.fields.expectedServiceDate')}
                value={renderValue(formatDateTime(lead.expected_service_date))}
              />
              <DetailItem
                label={t('detailSheet.fields.nextFollowUpAt')}
                value={renderValue(formatDateTime(lead.next_follow_up_at))}
              />
            </dl>
          </section>

          <section className="bg-card rounded-xl border border-white/10 p-4">
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              {t('detailSheet.sections.metadata')}
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label={t('detailSheet.fields.leadId')}
                value={lead.id}
              />
              <DetailItem
                label={t('detailSheet.fields.organizationId')}
                value={lead.organization_id}
              />
              <DetailItem
                label={t('detailSheet.fields.createdAt')}
                value={renderValue(formatDateTime(lead.created_at))}
              />
              <DetailItem
                label={t('detailSheet.fields.updatedAt')}
                value={renderValue(formatDateTime(lead.updated_at))}
              />
            </dl>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
