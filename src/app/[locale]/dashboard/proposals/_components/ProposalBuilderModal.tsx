'use client';

import { useTranslations } from 'next-intl';

import type { Lead } from '@/types/leads-generated';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { ProposalBuilder } from './ProposalBuilder';

type ProposalBuilderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
};

export function ProposalBuilderModal({
  open,
  onOpenChange,
  lead,
}: ProposalBuilderModalProps) {
  const t = useTranslations('Leads');

  const leadName = lead
    ? `${lead.first_name} ${lead.last_name}`.trim() || t('unknownLeadName')
    : t('unknownLeadName');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t('detailSheet.tabs.proposals')}</DialogTitle>
          <DialogDescription>
            Build and send a custom proposal for {leadName}.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <ProposalBuilder />
        </div>
      </DialogContent>
    </Dialog>
  );
}
