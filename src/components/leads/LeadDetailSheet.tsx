'use client';

import { formatDistanceToNow } from 'date-fns';
import { Link as LinkIcon, Mail, Phone } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useLeadSourcesQuery,
  usePipelineStagesQuery,
} from '@/hooks/useCrmSettings';
import {
  useCreateLeadAttachmentMutation,
  useCreateLeadNoteMutation,
  useLeadAttachmentsQuery,
  useLeadNotesQuery,
} from '@/hooks/useLeadActivity';
import { useOrganizationMembersQuery } from '@/hooks/useLeads';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/useAuthStore';
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

function toNameInitials(value: string): string {
  const parts = value
    .split(' ')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
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

function formatRelativeTime(value: string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return formatDistanceToNow(parsedDate, { addSuffix: true });
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
  const createNoteMutation = useCreateLeadNoteMutation();
  const createAttachmentMutation = useCreateLeadAttachmentMutation();

  const leadId = lead?.id ?? null;
  const notesQuery = useLeadNotesQuery(organizationId, leadId);
  const attachmentsQuery = useLeadAttachmentsQuery(organizationId, leadId);

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

  const handleCreateNote = async () => {
    const content = noteInput.trim();

    if (!organizationId || !leadId) {
      return;
    }

    if (!content) {
      toast.error(t('detailSheet.validation.noteRequired'));
      return;
    }

    try {
      await createNoteMutation.mutateAsync({
        orgId: organizationId,
        leadId,
        payload: {
          content,
        },
      });

      setNoteInput('');
      toast.success(t('detailSheet.notes.saved'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleCreateAttachment = async () => {
    const fileName = attachmentNameInput.trim();
    const fileUrl = attachmentUrlInput.trim();

    if (!organizationId || !leadId) {
      return;
    }

    if (!fileName) {
      toast.error(t('detailSheet.validation.linkNameRequired'));
      return;
    }

    if (!fileUrl) {
      toast.error(t('detailSheet.validation.urlRequired'));
      return;
    }

    try {
      const normalizedUrl = new URL(fileUrl).toString();

      await createAttachmentMutation.mutateAsync({
        orgId: organizationId,
        leadId,
        payload: {
          file_name: fileName,
          file_url: normalizedUrl,
        },
      });

      setAttachmentNameInput('');
      setAttachmentUrlInput('');
      toast.success(t('detailSheet.attachments.saved'));
    } catch (error) {
      if (error instanceof TypeError) {
        toast.error(t('detailSheet.validation.urlInvalid'));
        return;
      }

      toast.error(getErrorMessage(error));
    }
  };

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
              </TabsContent>

              <TabsContent
                value="notes"
                className="mt-4 min-h-0 flex-1 overflow-y-auto"
              >
                <section className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t('detailSheet.notes.inputLabel')}
                    </label>
                    <textarea
                      value={noteInput}
                      onChange={(event) => setNoteInput(event.target.value)}
                      placeholder={t('detailSheet.notes.inputPlaceholder')}
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => void handleCreateNote()}
                        disabled={createNoteMutation.isPending}
                      >
                        {createNoteMutation.isPending
                          ? t('detailSheet.notes.saving')
                          : t('detailSheet.notes.save')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {notesQuery.isLoading ? (
                      <p className="text-muted-foreground text-sm">
                        {t('loading')}
                      </p>
                    ) : (notesQuery.data ?? []).length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        {t('detailSheet.notes.empty')}
                      </p>
                    ) : (
                      (notesQuery.data ?? []).map((note) => {
                        const authorName =
                          note.author_name || t('detailSheet.values.unknown');

                        return (
                          <article
                            key={note.id}
                            className="bg-card rounded-xl border border-white/10 p-3"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs font-semibold">
                                  {toNameInitials(authorName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-foreground truncate text-sm font-semibold">
                                  {authorName}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {formatRelativeTime(
                                    note.created_at,
                                    t('notSet')
                                  )}
                                </p>
                              </div>
                            </div>
                            <p className="text-foreground text-sm leading-6 whitespace-pre-wrap">
                              {note.content}
                            </p>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              </TabsContent>

              <TabsContent
                value="attachments"
                className="mt-4 min-h-0 flex-1 overflow-y-auto"
              >
                <section className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t('detailSheet.attachments.linkName')}
                      </label>
                      <Input
                        value={attachmentNameInput}
                        onChange={(event) =>
                          setAttachmentNameInput(event.target.value)
                        }
                        placeholder={t(
                          'detailSheet.attachments.linkNamePlaceholder'
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t('detailSheet.attachments.url')}
                      </label>
                      <Input
                        value={attachmentUrlInput}
                        onChange={(event) =>
                          setAttachmentUrlInput(event.target.value)
                        }
                        placeholder={t(
                          'detailSheet.attachments.urlPlaceholder'
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void handleCreateAttachment()}
                      disabled={createAttachmentMutation.isPending}
                    >
                      {createAttachmentMutation.isPending
                        ? t('detailSheet.attachments.saving')
                        : t('detailSheet.attachments.save')}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {attachmentsQuery.isLoading ? (
                      <p className="text-muted-foreground text-sm">
                        {t('loading')}
                      </p>
                    ) : (attachmentsQuery.data ?? []).length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        {t('detailSheet.attachments.empty')}
                      </p>
                    ) : (
                      (attachmentsQuery.data ?? []).map((attachment) => (
                        <article
                          key={attachment.id}
                          className="bg-card rounded-xl border border-white/10 p-3"
                        >
                          <div className="flex items-start gap-2">
                            <LinkIcon className="text-muted-foreground mt-0.5 h-4 w-4" />
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground text-sm font-semibold">
                                {attachment.file_name}
                              </p>
                              <a
                                href={attachment.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary block truncate text-sm underline-offset-2 hover:underline"
                              >
                                {attachment.file_url}
                              </a>
                              <p className="text-muted-foreground mt-1 text-xs">
                                {t('detailSheet.attachments.uploadedBy', {
                                  user: attachment.uploaded_by,
                                })}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
