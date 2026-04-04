'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link as LinkIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/error-utils';
import { useCreateLeadAttachmentMutation, useLeadAttachmentsQuery } from '@/hooks/useLeadActivity';

type LeadAttachmentsTabProps = {
  organizationId: string | null;
  leadId: string | null;
  attachmentNameInput: string;
  setAttachmentNameInput: (val: string) => void;
  attachmentUrlInput: string;
  setAttachmentUrlInput: (val: string) => void;
};

export function LeadAttachmentsTab({
  organizationId,
  leadId,
  attachmentNameInput,
  setAttachmentNameInput,
  attachmentUrlInput,
  setAttachmentUrlInput,
}: LeadAttachmentsTabProps) {
  const t = useTranslations('Leads');
  const createAttachmentMutation = useCreateLeadAttachmentMutation();
  const attachmentsQuery = useLeadAttachmentsQuery(organizationId, leadId);

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

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('detailSheet.attachments.linkName')}
          </label>
          <Input
            value={attachmentNameInput}
            onChange={(event) => setAttachmentNameInput(event.target.value)}
            placeholder={t('detailSheet.attachments.linkNamePlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('detailSheet.attachments.url')}
          </label>
          <Input
            value={attachmentUrlInput}
            onChange={(event) => setAttachmentUrlInput(event.target.value)}
            placeholder={t('detailSheet.attachments.urlPlaceholder')}
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
          <p className="text-muted-foreground text-sm">{t('loading')}</p>
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
  );
}
