'use client';

import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/error-utils';
import { useCreateLeadNoteMutation, useLeadNotesQuery } from '@/hooks/useLeadActivity';

type LeadNotesTabProps = {
  organizationId: string | null;
  leadId: string | null;
  noteInput: string;
  setNoteInput: (val: string) => void;
};

function formatRelativeTime(value: Date | string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return formatDistanceToNow(parsedDate, { addSuffix: true });
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

export function LeadNotesTab({
  organizationId,
  leadId,
  noteInput,
  setNoteInput,
}: LeadNotesTabProps) {
  const t = useTranslations('Leads');
  const createNoteMutation = useCreateLeadNoteMutation();
  const notesQuery = useLeadNotesQuery(organizationId, leadId);

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
        payload: { content },
      });

      setNoteInput('');
      toast.success(t('detailSheet.notes.saved'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
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
          <p className="text-muted-foreground text-sm">{t('loading')}</p>
        ) : (notesQuery.data ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t('detailSheet.notes.empty')}
          </p>
        ) : (
          (notesQuery.data ?? []).map((note) => {
            const authorName = note.author_name || t('detailSheet.values.unknown');

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
                      {formatRelativeTime(note.created_at, t('notSet'))}
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
  );
}
