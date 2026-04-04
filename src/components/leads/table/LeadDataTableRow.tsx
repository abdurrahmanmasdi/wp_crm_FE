'use client';

import { useState } from 'react';
import type { Row } from '@tanstack/react-table';
import { Check, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TableCell, TableRow } from '@/components/ui/table';
import type { LeadStatus, LeadWithRelations } from '@/types/leads';
import { LeadRowActions } from './LeadRowActions';

type MemberOption = {
  value: string;
  label: string;
};

type LeadDataTableRowProps = {
  row: Row<LeadWithRelations>;
  lead: LeadWithRelations;
  sourceLabel: string | undefined;
  assignedDisplayName: string | null;
  estimatedValue: string;
  createdAt: string;
  canEditLeads: boolean;
  canDeleteLeads: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  members: MemberOption[];
  onStatusSelect: (
    lead: LeadWithRelations,
    status: LeadStatus
  ) => Promise<void>;
  onAgentSelect: (
    lead: LeadWithRelations,
    assignedAgentId: string | null
  ) => Promise<void>;
  onView: (lead: LeadWithRelations) => void;
  onEdit: (lead: LeadWithRelations) => void;
  onDelete: (lead: LeadWithRelations) => void;
  onCopyPhone: (phone: string) => void;
};

const statusOptions: LeadStatus[] = ['OPEN', 'WON', 'LOST', 'UNQUALIFIED'];

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

function toInitials(name: string): string {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

export function LeadDataTableRow({
  row,
  lead,
  sourceLabel,
  assignedDisplayName,
  estimatedValue,
  createdAt,
  canEditLeads,
  canDeleteLeads,
  isDeleting,
  isUpdating,
  members,
  onStatusSelect,
  onAgentSelect,
  onView,
  onEdit,
  onDelete,
  onCopyPhone,
}: LeadDataTableRowProps) {
  const t = useTranslations('Leads');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  const leadName = `${lead.first_name} ${lead.last_name}`.trim();

  return (
    <TableRow className="border-white/5 hover:bg-white/5">
      <TableCell className="w-10">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          aria-label={t('bulkBar.selectLead', {
            name: leadName || t('unknownLeadName'),
          })}
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <p className="text-foreground text-sm font-medium">
            {leadName || t('unknownLeadName')}
          </p>
          <p className="text-muted-foreground text-xs">
            {lead.email || t('notSet')}
          </p>
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground text-sm">
        {sourceLabel ?? t('notSet')}
      </TableCell>

      <TableCell>
        {canEditLeads ? (
          <Popover open={isAgentOpen} onOpenChange={setIsAgentOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="group hover:bg-accent flex h-8 w-56 items-center justify-between gap-2 rounded-md px-1.5 text-left"
                disabled={isUpdating}
                aria-label={t('editAction')}
              >
                <div className="min-w-0 flex-1">
                  {assignedDisplayName ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {toInitials(assignedDisplayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground truncate text-xs font-medium">
                        {assignedDisplayName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {t('assignAction')}
                    </span>
                  )}
                </div>
                <Pencil className="text-muted-foreground h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-80" />
              </button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-64 p-1">
              <div className="max-h-64 space-y-1 overflow-auto">
                <button
                  type="button"
                  className="hover:bg-accent flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm"
                  onClick={() => {
                    setIsAgentOpen(false);
                    void onAgentSelect(lead, null);
                  }}
                >
                  <span>{t('notSet')}</span>
                  {!lead.assigned_agent_id ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                </button>

                {members.map((agent) => {
                  const displayName = agent.label.split(' (')[0] || agent.label;

                  return (
                    <button
                      key={agent.value}
                      type="button"
                      className="hover:bg-accent flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm"
                      onClick={() => {
                        setIsAgentOpen(false);
                        void onAgentSelect(lead, agent.value);
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {toInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{displayName}</span>
                      </span>
                      {lead.assigned_agent_id === agent.value ? (
                        <Check className="h-4 w-4" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        ) : assignedDisplayName ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">
                {toInitials(assignedDisplayName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground text-xs">
              {assignedDisplayName}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">{t('notSet')}</span>
        )}
      </TableCell>

      <TableCell>
        <Badge className={getPriorityBadgeClass(lead.priority)}>
          {t(`priority.${lead.priority}` as never)}
        </Badge>
      </TableCell>

      <TableCell>
        {canEditLeads ? (
          <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="group hover:bg-accent inline-flex h-8 items-center gap-2 rounded-md px-1.5"
                disabled={isUpdating}
                aria-label={t('editAction')}
              >
                <Badge className={getStatusBadgeClass(lead.status)}>
                  {t(`status.${lead.status}` as never)}
                </Badge>
                <Pencil className="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-80" />
              </button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-44 p-1">
              <div className="space-y-1">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="hover:bg-accent flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm"
                    onClick={() => {
                      setIsStatusOpen(false);
                      void onStatusSelect(lead, status);
                    }}
                  >
                    <span>{t(`status.${status}` as never)}</span>
                    {lead.status === status ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Badge className={getStatusBadgeClass(lead.status)}>
            {t(`status.${lead.status}` as never)}
          </Badge>
        )}
      </TableCell>

      <TableCell className="text-foreground text-sm">
        {estimatedValue}
      </TableCell>

      <TableCell className="text-muted-foreground text-sm">
        {createdAt}
      </TableCell>

      <TableCell className="text-right">
        <LeadRowActions
          canEditLeads={canEditLeads}
          canDeleteLeads={canDeleteLeads}
          isDeleting={isDeleting}
          onView={() => onView(lead)}
          onEdit={() => onEdit(lead)}
          onCopyPhone={() => onCopyPhone(lead.phone_number)}
          onDelete={() => onDelete(lead)}
        />
      </TableCell>
    </TableRow>
  );
}
