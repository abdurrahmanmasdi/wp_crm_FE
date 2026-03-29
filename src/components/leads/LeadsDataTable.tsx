'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppAction, AppResource } from '@/constants/permissions.registry';
import { useLeadSourcesQuery } from '@/hooks/useCrmSettings';
import {
  useOrganizationMembersQuery,
  useUpdateLeadMutation,
} from '@/hooks/useLeads';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/error-utils';
import type { Lead, LeadsMeta, LeadStatus } from '@/types/leads';

import { EditLeadSheet } from './EditLeadSheet';
import { LeadDetailSheet } from './LeadDetailSheet';

type LeadsDataTableProps = {
  leads: Lead[];
  isLoading: boolean;
  error: unknown;
  onDeleteLead: (lead: Lead) => void;
  deletingLeadId: string | null;
  pagination: LeadsMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

const statusOptions: LeadStatus[] = ['OPEN', 'WON', 'LOST', 'UNQUALIFIED'];
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

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

function formatEstimatedValue(
  estimatedValue: string,
  currency: string,
  fallback: string
): string {
  const parsedValue = Number(estimatedValue);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(parsedValue);
  } catch {
    return `${estimatedValue} ${currency}`;
  }
}

function formatCreatedAt(dateValue: string | null, fallback: string): string {
  if (!dateValue) {
    return fallback;
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(parsedDate);
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

function getAgentDisplayName(label: string): string {
  return label.split(' (')[0] || label;
}

function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number
): number[] {
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, currentPage - halfWindow);
  const end = Math.min(totalPages, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function LeadsDataTable({
  leads,
  isLoading,
  error,
  onDeleteLead,
  deletingLeadId,
  pagination,
  onPageChange,
  onLimitChange,
}: LeadsDataTableProps) {
  const t = useTranslations('Leads');
  const { hasPermission } = usePermissions();
  const membersQuery = useOrganizationMembersQuery();
  const leadSourcesQuery = useLeadSourcesQuery();
  const updateLeadMutation = useUpdateLeadMutation();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [openStatusLeadId, setOpenStatusLeadId] = useState<string | null>(null);
  const [openAgentLeadId, setOpenAgentLeadId] = useState<string | null>(null);

  const canEditLeads =
    hasPermission(AppResource.LEADS, AppAction.EDIT) ||
    hasPermission(AppResource.LEADS, AppAction.EDIT_ALL) ||
    hasPermission(AppResource.LEADS, 'update');
  const canDeleteLeads =
    hasPermission(AppResource.LEADS, AppAction.DELETE) ||
    hasPermission(AppResource.LEADS, AppAction.DELETE_ALL);

  const sourceLabelMap = useMemo(
    () =>
      new Map(
        (leadSourcesQuery.data ?? []).map(
          (source) => [source.id, source.name] as const
        )
      ),
    [leadSourcesQuery.data]
  );
  const agentLabelMap = useMemo(
    () =>
      new Map(
        (membersQuery.data ?? []).map((agent) => [agent.value, agent.label])
      ),
    [membersQuery.data]
  );

  const updatingLeadId =
    updateLeadMutation.isPending && updateLeadMutation.variables
      ? updateLeadMutation.variables.leadId
      : null;

  const currentLimit = pagination.limit > 0 ? pagination.limit : 20;
  const totalRows = Math.max(0, pagination.total);
  const totalPagesFromMeta =
    pagination.totalPages > 0
      ? pagination.totalPages
      : totalRows > 0
        ? Math.ceil(totalRows / currentLimit)
        : 1;
  const totalPages = Math.max(1, totalPagesFromMeta);
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  const pageNumbers = useMemo(
    () => getVisiblePageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const visibleFrom =
    totalRows === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
  const visibleTo =
    totalRows === 0 ? 0 : Math.min(currentPage * currentLimit, totalRows);

  const handleInlineUpdate = async (
    leadId: string,
    payload: { status?: LeadStatus; assigned_agent_id?: string | null }
  ) => {
    try {
      await updateLeadMutation.mutateAsync({
        leadId,
        payload,
      });
      toast.success(t('saved'));
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError) || t('updatedError'));
    }
  };

  const handleStatusSelect = async (lead: Lead, status: LeadStatus) => {
    setOpenStatusLeadId(null);

    if (lead.status === status) {
      return;
    }

    await handleInlineUpdate(lead.id, {
      status,
    });
  };

  const handleAgentSelect = async (
    lead: Lead,
    assignedAgentId: string | null
  ) => {
    setOpenAgentLeadId(null);

    if (lead.assigned_agent_id === assignedAgentId) {
      return;
    }

    await handleInlineUpdate(lead.id, {
      assigned_agent_id: assignedAgentId,
    });
  };

  const handleCopyPhone = async (phoneNumber: string) => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      toast.success(t('copyPhoneSuccess'));
    } catch {
      toast.error(t('copyPhoneError'));
    }
  };

  const handlePageNavigation = (nextPage: number) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), totalPages);

    if (clampedPage !== currentPage) {
      onPageChange(clampedPage);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-card flex min-h-0 flex-1 rounded-2xl border border-white/5 p-4 shadow-2xl shadow-black/20">
        <p className="text-muted-foreground text-sm">{t('loading')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-card flex min-h-0 flex-1 rounded-2xl border border-white/5 p-4 shadow-2xl shadow-black/20">
        <div className="bg-background w-full rounded-xl border border-dashed border-white/10 p-6 text-center">
          <p className="text-destructive text-sm font-semibold">
            {t('loadErrorTitle')}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {getErrorMessage(error)}
          </p>
        </div>
      </section>
    );
  }

  if (leads.length === 0) {
    return (
      <section className="bg-card flex min-h-0 flex-1 rounded-2xl border border-white/5 p-4 shadow-2xl shadow-black/20">
        <div className="bg-background w-full rounded-xl border border-dashed border-white/10 p-8 text-center">
          <p className="text-foreground text-sm font-semibold">
            {t('emptyTitle')}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('emptyDescription')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 p-3 shadow-2xl shadow-black/20">
        <div className="bg-background min-h-0 flex-1 overflow-auto rounded-lg border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  {t('tableHeaders.lead')}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {t('tableHeaders.source')}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {t('tableHeaders.assignedTo')}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {t('tableHeaders.priority')}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {t('tableHeaders.status')}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {t('tableHeaders.estimatedValue')}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {t('tableHeaders.createdAt')}
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  {t('tableHeaders.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {leads.map((lead) => {
                const leadName = `${lead.first_name} ${lead.last_name}`.trim();
                const estimatedValue = formatEstimatedValue(
                  lead.estimated_value,
                  lead.currency,
                  t('notSet')
                );
                const createdAt = formatCreatedAt(lead.created_at, t('notSet'));
                const isDeleting = deletingLeadId === lead.id;
                const isUpdating = updatingLeadId === lead.id;

                const assignedLabel = lead.assigned_agent_id
                  ? (agentLabelMap.get(lead.assigned_agent_id) ?? t('notSet'))
                  : null;
                const assignedDisplayName = assignedLabel
                  ? getAgentDisplayName(assignedLabel)
                  : null;
                const sourceLabel = lead.source_id
                  ? sourceLabelMap.get(lead.source_id)
                  : null;

                return (
                  <TableRow
                    key={lead.id}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => setViewingLead(lead)}
                          className="text-primary w-fit text-left text-sm font-medium underline-offset-2 hover:underline"
                        >
                          {leadName || t('unknownLeadName')}
                        </button>
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
                        <Popover
                          open={openAgentLeadId === lead.id}
                          onOpenChange={(open) =>
                            setOpenAgentLeadId(open ? lead.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="group hover:bg-accent flex h-8 w-56 items-center justify-between gap-2 rounded-md px-1.5 text-left"
                              disabled={isUpdating || membersQuery.isLoading}
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
                                onClick={() =>
                                  void handleAgentSelect(lead, null)
                                }
                              >
                                <span>{t('notSet')}</span>
                                {!lead.assigned_agent_id ? (
                                  <Check className="h-4 w-4" />
                                ) : null}
                              </button>

                              {(membersQuery.data ?? []).map((agent) => {
                                const displayName = getAgentDisplayName(
                                  agent.label
                                );

                                return (
                                  <button
                                    key={agent.value}
                                    type="button"
                                    className="hover:bg-accent flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm"
                                    onClick={() =>
                                      void handleAgentSelect(lead, agent.value)
                                    }
                                  >
                                    <span className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-[10px]">
                                          {toInitials(displayName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate">
                                        {displayName}
                                      </span>
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
                        <span className="text-muted-foreground text-xs">
                          {t('notSet')}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className={getPriorityBadgeClass(lead.priority)}>
                        {t(`priority.${lead.priority}` as never)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {canEditLeads ? (
                        <Popover
                          open={openStatusLeadId === lead.id}
                          onOpenChange={(open) =>
                            setOpenStatusLeadId(open ? lead.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="group hover:bg-accent inline-flex h-8 items-center gap-2 rounded-md px-1.5"
                              disabled={isUpdating}
                              aria-label={t('editAction')}
                            >
                              <Badge
                                className={getStatusBadgeClass(lead.status)}
                              >
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
                                  onClick={() =>
                                    void handleStatusSelect(lead, status)
                                  }
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('actions')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-card border-white/10"
                        >
                          {canEditLeads ? (
                            <DropdownMenuItem
                              className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                              onClick={() => setEditingLead(lead)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {t('editAction')}
                            </DropdownMenuItem>
                          ) : null}

                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                            onClick={() => handleCopyPhone(lead.phone_number)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {t('copyPhoneAction')}
                          </DropdownMenuItem>

                          {canDeleteLeads ? <DropdownMenuSeparator /> : null}

                          {canDeleteLeads ? (
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer hover:bg-white/5 focus:bg-white/5"
                              disabled={isDeleting}
                              onClick={() => onDeleteLead(lead)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {isDeleting ? t('deleting') : t('deleteLead')}
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-1 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground text-xs">
              {t('pagination.rowsPerPage')}
            </p>

            <Select
              value={String(currentLimit)}
              onValueChange={(value) => {
                const nextLimit = Number(value);
                if (Number.isFinite(nextLimit)) {
                  onLimitChange(nextLimit);
                }
              }}
            >
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-muted-foreground text-xs">
              {t('pagination.range', {
                from: visibleFrom,
                to: visibleTo,
                total: totalRows,
              })}
            </p>
          </div>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    handlePageNavigation(currentPage - 1);
                  }}
                  className={
                    currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                  }
                >
                  {t('pagination.previous')}
                </PaginationPrevious>
              </PaginationItem>

              {pageNumbers.map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    isActive={pageNumber === currentPage}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageNavigation(pageNumber);
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    handlePageNavigation(currentPage + 1);
                  }}
                  className={
                    currentPage >= totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                >
                  {t('pagination.next')}
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </section>

      <EditLeadSheet
        lead={editingLead}
        open={Boolean(editingLead)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingLead(null);
          }
        }}
      />

      <LeadDetailSheet
        lead={viewingLead}
        open={Boolean(viewingLead)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewingLead(null);
          }
        }}
      />
    </>
  );
}
