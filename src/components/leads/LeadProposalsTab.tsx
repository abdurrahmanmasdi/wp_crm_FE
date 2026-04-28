'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Download,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getProposalsControllerFindAllV1QueryKey,
  useProposalsControllerFindAllV1 as useProposalsControllerFindAll,
  useProposalsControllerRemoveV1,
} from '@/api-generated/endpoints/proposals';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type LeadProposalsTabProps = {
  leadId: string | null;
  onCreateFirstProposal?: () => void;
};

type ProposalStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'RECEIPT_UPLOADED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

type LeadProposal = {
  id: string;
  lead_id: string;
  status: ProposalStatus;
  total_amount: number;
  currency: string;
  public_link_hash: string;
  created_at: string;
  updated_at: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function normalizeStatus(value: unknown): ProposalStatus {
  const status = asString(value).toUpperCase();

  switch (status) {
    case 'SENT':
    case 'ACCEPTED':
    case 'RECEIPT_UPLOADED':
    case 'VERIFIED':
    case 'REJECTED':
    case 'EXPIRED':
      return status;
    default:
      return 'DRAFT';
  }
}

function normalizeProposal(raw: unknown): LeadProposal | null {
  const record = asRecord(raw);
  const id = asString(record.id);

  if (!id) {
    return null;
  }

  return {
    id,
    lead_id: asString(record.lead_id),
    status: normalizeStatus(record.status),
    total_amount: asNumber(record.total_amount),
    currency: asString(record.currency) || 'USD',
    public_link_hash: asString(record.public_link_hash),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
  };
}

function normalizeProposalList(raw: unknown): LeadProposal[] {
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeProposal)
      .filter((item): item is LeadProposal => item !== null);
  }

  const record = asRecord(raw);
  const list = Array.isArray(record.data)
    ? record.data
    : Array.isArray(record.items)
      ? record.items
      : [];

  return list
    .map(normalizeProposal)
    .filter((item): item is LeadProposal => item !== null);
}

function getStatusBadgeClass(status: ProposalStatus): string {
  switch (status) {
    case 'ACCEPTED':
    case 'VERIFIED':
      return 'border-green-500/30 bg-green-500/10 text-green-400';
    case 'SENT':
    case 'RECEIPT_UPLOADED':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
    case 'REJECTED':
    case 'EXPIRED':
      return 'border-red-500/30 bg-red-500/10 text-red-400';
    default:
      return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300';
  }
}

function formatDate(value: string): string {
  if (!value) {
    return 'Unknown date';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function getPublicProposalUrl(hash: string): string {
  return `https://crm.yourdomain.com/p/${hash}`;
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function LeadProposalsTab({
  leadId,
  onCreateFirstProposal,
}: LeadProposalsTabProps) {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filters = useMemo(() => {
    if (!leadId) {
      return undefined;
    }

    return JSON.stringify([
      {
        field: 'lead_id',
        operator: 'equals',
        value: leadId,
      },
    ]);
  }, [leadId]);

  const listParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      ...(filters ? { filters } : {}),
    }),
    [filters]
  );

  const proposalsQuery = useProposalsControllerFindAll(
    organizationId ?? '',
    listParams,
    {
      query: {
        enabled: Boolean(organizationId && leadId),
      },
    }
  );

  const { mutateAsync: removeProposal } = useProposalsControllerRemoveV1();

  const proposals = useMemo(() => {
    const normalized = normalizeProposalList(proposalsQuery.data);

    if (!leadId) {
      return normalized;
    }

    return normalized.filter((proposal) => proposal.lead_id === leadId);
  }, [leadId, proposalsQuery.data]);

  const handleCopyLink = async (hash: string) => {
    if (!hash) {
      toast.error('Proposal link is not available yet.');
      return;
    }

    const url = getPublicProposalUrl(hash);

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Proposal link copied to clipboard.');
    } catch {
      toast.error('Could not copy link. Please copy it manually.');
    }
  };

  const handleViewLink = (hash: string) => {
    if (!hash) {
      toast.error('Proposal link is not available yet.');
      return;
    }

    window.open(getPublicProposalUrl(hash), '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (proposalId: string) => {
    if (!organizationId) {
      toast.error('No active organization selected.');
      return;
    }

    setDeletingId(proposalId);

    try {
      await removeProposal({ organizationId, id: proposalId });

      await queryClient.invalidateQueries({
        queryKey: getProposalsControllerFindAllV1QueryKey(
          organizationId,
          listParams
        ),
      });

      toast.success('Proposal deleted successfully.');
    } catch {
      toast.error('Failed to delete proposal. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!leadId) {
    return (
      <div className="bg-muted/30 text-muted-foreground rounded-lg border border-white/10 p-4 text-sm">
        Lead identifier is not available.
      </div>
    );
  }

  if (proposalsQuery.isLoading) {
    return (
      <div className="bg-muted/30 text-muted-foreground rounded-lg border border-white/10 p-6 text-sm">
        Loading proposals...
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="bg-muted/40 rounded-full border border-white/10 p-3">
            <FileText className="text-muted-foreground h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold">No proposals sent yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Create your first proposal for this lead to get started.
            </p>
          </div>
          <Button
            onClick={onCreateFirstProposal}
            disabled={!onCreateFirstProposal}
          >
            Create First Proposal
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal) => (
        <Card key={proposal.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  {formatAmount(proposal.total_amount, proposal.currency)}
                </CardTitle>
                <p className="text-muted-foreground mt-1 text-sm">
                  {formatDate(proposal.created_at || proposal.updated_at)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getStatusBadgeClass(proposal.status)}>
                  {proposal.status}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleViewLink(proposal.public_link_hash)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Link
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        toast.info('PDF download will be available soon.');
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(proposal.id)}
                      disabled={deletingId === proposal.id}
                      className="text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === proposal.id ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground truncate text-sm">
                {proposal.public_link_hash
                  ? getPublicProposalUrl(proposal.public_link_hash)
                  : 'Public link not generated yet'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleCopyLink(proposal.public_link_hash)}
                disabled={!proposal.public_link_hash}
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
