'use client';

import { useMemo, useState } from 'react';
import { Check, CheckCircle2, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ProposalSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicLinkHash: string;
  clientName: string;
  clientPhone: string;
}

function normalizePhone(rawPhone: string): string {
  return rawPhone.replace(/[^0-9]/g, '');
}

export function ProposalSuccessModal({
  open,
  onOpenChange,
  publicLinkHash,
  clientName,
  clientPhone,
}: ProposalSuccessModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const proposalUrl = useMemo(() => {
    return `https://crm.yourdomain.com/p/${publicLinkHash}`;
  }, [publicLinkHash]);

  const whatsappLink = useMemo(() => {
    const normalizedPhone = normalizePhone(clientPhone);
    const message = `Hello ${clientName}, here is your custom proposal: ${proposalUrl}`;
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
  }, [clientName, clientPhone, proposalUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(proposalUrl);
      setIsCopied(true);
      toast.success('Proposal link copied to clipboard');
      setTimeout(() => setIsCopied(false), 1600);
    } catch {
      toast.error('Failed to copy link. Please copy manually.');
    }
  };

  const handleShareWhatsApp = () => {
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="items-center text-center">
          <div className="relative mb-2 flex h-28 w-28 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/20" />
            <span className="absolute inline-flex h-[86%] w-[86%] rounded-full border border-emerald-300/30 bg-emerald-500/10" />
            <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </span>
          </div>

          <DialogTitle className="text-2xl font-bold">
            Proposal Created Successfully
          </DialogTitle>
          <DialogDescription className="max-w-md">
            Your proposal is live and ready to send. Share the secure public
            link with your client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-sm font-medium">Public Proposal Link</label>
          <div className="flex items-center gap-2">
            <Input value={proposalUrl} readOnly className="font-mono text-xs" />
            <Button
              type="button"
              onClick={handleCopyLink}
              className="min-w-28 gap-2"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleShareWhatsApp}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" />
            Share on WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
