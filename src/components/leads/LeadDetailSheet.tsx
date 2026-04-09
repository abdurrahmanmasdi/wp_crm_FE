'use client';

import { formatDistanceToNow } from 'date-fns';
import { Link as LinkIcon, Mail, Phone } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useLeadSourcesQuery,
  usePipelineStagesQuery,
} from '@/hooks/useCrmSettings';
import { useOrganizationMembersQuery } from '@/hooks/useLeads';
import { useAuthStore } from '@/store/useAuthStore';
import type { Lead } from '@/types/leads-generated';

import { LeadDetailsTab } from './LeadDetailsTab';
import { LeadNotesTab } from './LeadNotesTab';
import { LeadAttachmentsTab } from './LeadAttachmentsTab';

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

function formatDateTime(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
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

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: LeadDetailSheetProps) {
  const locale = useLocale();
  const t = useTranslations('Leads');
  const tTimezones = useTranslations('Timezones');
  const organizationId = useAuthStore((state) => state.activeOrganizationId);
  const pipelineStagesQuery = usePipelineStagesQuery();
  const leadSourcesQuery = useLeadSourcesQuery();
  const membersQuery = useOrganizationMembersQuery();

  const leadId = lead?.id ?? null;

  const [noteInput, setNoteInput] = useState('');
  const [attachmentNameInput, setAttachmentNameInput] = useState('');
  const [attachmentUrlInput, setAttachmentUrlInput] = useState('');

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

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNoteInput('');
      setAttachmentNameInput('');
      setAttachmentUrlInput('');
    }

    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full p-0 sm:max-w-2xl">
        <div className="flex h-full min-h-0 flex-col">
          <section className="bg-background border-border/80 sticky top-0 z-20 border-b px-6 py-5">
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

            <div className="bg-muted/40 mt-4 rounded-xl border border-white/10 p-4">
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
            </div>
          </section>

          <div className="min-h-0 flex-1 px-6 pb-6">
            <Tabs
              defaultValue="details"
              className="flex h-full min-h-0 flex-col"
            >
              <TabsList className="bg-background mt-3 grid h-9 w-full grid-cols-3 rounded-lg border border-white/10 p-1">
                <TabsTrigger value="details">
                  {t('detailSheet.tabs.details')}
                </TabsTrigger>
                <TabsTrigger value="notes">
                  {t('detailSheet.tabs.notes')}
                </TabsTrigger>
                <TabsTrigger value="attachments">
                  {t('detailSheet.tabs.attachments')}
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="details"
                className="mt-4 min-h-0 flex-1 overflow-y-auto"
              >
                <LeadDetailsTab
                  lead={lead}
                  pipelineStageName={pipelineStageName}
                  sourceName={sourceName}
                  assignedAgentName={assignedAgentName}
                  localizedCountry={localizedCountry}
                  localizedTimezone={localizedTimezone}
                  localizedLanguages={localizedLanguages}
                  formatEstimatedValue={formatEstimatedValue}
                  formatDateTime={formatDateTime}
                  renderValue={renderValue}
                />
              </TabsContent>

              <TabsContent
                value="notes"
                className="mt-4 min-h-0 flex-1 overflow-y-auto"
              >
                <LeadNotesTab
                  organizationId={organizationId}
                  leadId={leadId}
                  noteInput={noteInput}
                  setNoteInput={setNoteInput}
                />
              </TabsContent>

              <TabsContent
                value="attachments"
                className="mt-4 min-h-0 flex-1 overflow-y-auto"
              >
                <LeadAttachmentsTab
                  organizationId={organizationId}
                  leadId={leadId}
                  attachmentNameInput={attachmentNameInput}
                  setAttachmentNameInput={setAttachmentNameInput}
                  attachmentUrlInput={attachmentUrlInput}
                  setAttachmentUrlInput={setAttachmentUrlInput}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
