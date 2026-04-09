'use client';

import type { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LeadStatus, LeadWithRelations } from '@/types/leads-generated';

const statusOptions: LeadStatus[] = ['OPEN', 'WON', 'LOST', 'UNQUALIFIED'];
const UNASSIGNED_AGENT_VALUE = '__unassigned__';

type AgentOption = {
  value: string;
  label: string;
};

type LeadsBulkActionBarProps = {
  table: Table<LeadWithRelations>;
  isPending: boolean;
  isAgentsLoading: boolean;
  agentOptions: AgentOption[];
  onStatusChange: (status: LeadStatus) => void | Promise<void>;
  onAgentAssign: (agentId: string) => void | Promise<void>;
  onClear: () => void;
};

function getAgentDisplayName(label: string): string {
  return label.split(' (')[0] || label;
}

export function LeadsBulkActionBar({
  table,
  isPending,
  isAgentsLoading,
  agentOptions,
  onStatusChange,
  onAgentAssign,
  onClear,
}: LeadsBulkActionBarProps) {
  const t = useTranslations('Leads');
  const selectedRowsCount = table.getSelectedRowModel().rows.length;

  if (selectedRowsCount === 0) {
    return null;
  }

  return (
    <div className="bg-background/95 border-border fixed bottom-8 left-1/2 z-50 flex w-[min(92vw,760px)] -translate-x-1/2 flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="text-foreground text-sm font-semibold">
        {t('bulkBar.selectedCount', { count: selectedRowsCount })}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          onValueChange={(value) => {
            void onStatusChange(value as LeadStatus);
          }}
        >
          <SelectTrigger className="h-9 w-40" disabled={isPending}>
            <SelectValue placeholder={t('bulkBar.changeStatus')} />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status}` as never)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => {
            void onAgentAssign(value === UNASSIGNED_AGENT_VALUE ? '' : value);
          }}
        >
          <SelectTrigger
            className="h-9 w-44"
            disabled={isPending || isAgentsLoading}
          >
            <SelectValue placeholder={t('bulkBar.assignAgent')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED_AGENT_VALUE}>
              {t('bulkBar.unassigned')}
            </SelectItem>
            {agentOptions.map((agent) => (
              <SelectItem key={agent.value} value={agent.value}>
                {getAgentDisplayName(agent.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          aria-label={t('bulkBar.clearSelection')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
