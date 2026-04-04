'use client';
'use no memo';

import { useMemo, useState } from 'react';
import {
  getCoreRowModel,
  type OnChangeFn,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/lib/error-utils';
import type {
  LeadsMeta,
  LeadSortBy,
  LeadSortDir,
  LeadWithRelations,
} from '@/types/leads';

import { EditLeadSheet } from './EditLeadSheet';
import { LeadDetailSheet } from './LeadDetailSheet';
import type { LeadFilterRule } from './filters';
import { LeadsBulkActionBar } from './table/LeadsBulkActionBar';
import { leadsColumns } from './table/columns';
import { LeadDataTableRow } from './table/LeadDataTableRow';
import { LeadsTablePagination } from './table/LeadsTablePagination';
import { LeadsTableToolbar } from './table/LeadsTableToolbar';
import { useLeadTableActions } from './table/useLeadTableActions';

type LeadsDataTableProps = {
  leads: LeadWithRelations[];
  isLoading: boolean;
  error: unknown;
  organizationId: string;
  initialRules: LeadFilterRule[];
  onRulesChange: (rules: LeadFilterRule[]) => void;
  onExportCsv: () => void | Promise<void>;
  isExporting: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onDeleteLead: (lead: LeadWithRelations) => void;
  deletingLeadId: string | null;
  pagination: LeadsMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sortBy?: LeadSortBy;
  sortDir?: LeadSortDir;
  onSortChange: (sortBy?: LeadSortBy, sortDir?: LeadSortDir) => void;
};

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

function formatCreatedAt(
  dateValue: Date | string | null,
  fallback: string
): string {
  if (!dateValue) {
    return fallback;
  }

  const parsedDate =
    dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(parsedDate);
}

export function LeadsDataTable({
  leads,
  isLoading,
  error,
  organizationId,
  initialRules,
  onRulesChange,
  onExportCsv,
  isExporting,
  searchValue,
  onSearchChange,
  onDeleteLead,
  deletingLeadId,
  pagination,
  onPageChange,
  onLimitChange,
  sortBy,
  sortDir,
  onSortChange,
}: LeadsDataTableProps) {
  const t = useTranslations('Leads');

  const {
    rowSelection,
    setRowSelection,
    canEditLeads,
    canDeleteLeads,
    sourceLabelMap,
    agentLabelMap,
    membersQuery,
    updatingLeadId,
    isBulkUpdating,
    handleStatusSelect,
    handleAgentSelect,
    handleCopyPhone,
    handleClearSelection,
    handleBulkStatusUpdate,
    handleBulkAgentUpdate,
    getAgentDisplayName,
  } = useLeadTableActions();

  const [editingLead, setEditingLead] = useState<LeadWithRelations | null>(
    null
  );
  const [viewingLead, setViewingLead] = useState<LeadWithRelations | null>(
    null
  );

  const sortingState = useMemo<SortingState>(() => {
    if (!sortBy || !sortDir) {
      return [];
    }

    return [
      {
        id: sortBy,
        desc: sortDir === 'desc',
      },
    ];
  }, [sortBy, sortDir]);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const nextSorting =
      typeof updater === 'function' ? updater(sortingState) : updater;
    const primarySort = nextSorting[0];

    if (!primarySort || !primarySort.id) {
      onSortChange(undefined, undefined);
      return;
    }

    onSortChange(
      primarySort.id as LeadSortBy,
      primarySort.desc ? 'desc' : 'asc'
    );
  };

  const table = useReactTable({
    data: leads,
    columns: leadsColumns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableRowSelection: true,
    onSortingChange: handleSortingChange,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting: sortingState,
      rowSelection,
    },
  });

  const tableRows = table.getRowModel().rows;
  const selectedLeadIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);

  const handleSortToggle = (columnId: LeadSortBy) => {
    const column = table.getColumn(columnId);
    if (!column) {
      return;
    }

    column.toggleSorting(column.getIsSorted() === 'asc');
  };

  const getSortIndicator = (columnId: LeadSortBy) => {
    const sortedState = table.getColumn(columnId)?.getIsSorted();

    if (sortedState === 'asc') {
      return <ArrowUp className="h-3.5 w-3.5" />;
    }

    if (sortedState === 'desc') {
      return <ArrowDown className="h-3.5 w-3.5" />;
    }

    return null;
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

  return (
    <>
      <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 p-3 shadow-2xl shadow-black/20">
        <div className="space-y-4">
          <LeadsTableToolbar
            organizationId={organizationId}
            initialRules={initialRules}
            onRulesChange={onRulesChange}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onExportCsv={onExportCsv}
            isExporting={isExporting}
            isLoading={isLoading}
          />

          <div className="rounded-md border border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        table.getIsAllPageRowsSelected()
                          ? true
                          : table.getIsSomePageRowsSelected()
                            ? 'indeterminate'
                            : false
                      }
                      onCheckedChange={(checked) =>
                        table.toggleAllPageRowsSelected(checked === true)
                      }
                      aria-label={t('bulkBar.selectAll')}
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('first_name')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('tableHeaders.lead')}
                      {getSortIndicator('first_name')}
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t('tableHeaders.source')}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t('tableHeaders.assignedTo')}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('priority')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('tableHeaders.priority')}
                      {getSortIndicator('priority')}
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('status')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('tableHeaders.status')}
                      {getSortIndicator('status')}
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('estimated_value')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('tableHeaders.estimatedValue')}
                      {getSortIndicator('estimated_value')}
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('created_at')}
                      className="inline-flex items-center gap-1"
                    >
                      {t('tableHeaders.createdAt')}
                      {getSortIndicator('created_at')}
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    {t('tableHeaders.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {tableRows.length === 0 ? (
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableCell colSpan={9} className="py-10 text-center">
                      <p className="text-muted-foreground text-sm">
                        {leads.length === 0
                          ? t('emptyDescription')
                          : t('noResultsFound')}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  tableRows.map((row) => {
                    const lead = row.original;
                    const estimatedValue = formatEstimatedValue(
                      lead.estimated_value,
                      lead.currency,
                      t('notSet')
                    );
                    const createdAt = formatCreatedAt(
                      lead.created_at,
                      t('notSet')
                    );
                    const isDeleting = deletingLeadId === lead.id;
                    const isUpdating = updatingLeadId === lead.id;

                    const assignedLabel = lead.assigned_agent_id
                      ? (agentLabelMap.get(lead.assigned_agent_id) ??
                        t('notSet'))
                      : null;
                    const assignedDisplayName = assignedLabel
                      ? getAgentDisplayName(assignedLabel)
                      : null;
                    const sourceLabel = lead.source_id
                      ? sourceLabelMap.get(lead.source_id)
                      : null;

                    return (
                      <LeadDataTableRow
                        key={row.id}
                        row={row}
                        lead={lead}
                        sourceLabel={sourceLabel ?? undefined}
                        assignedDisplayName={assignedDisplayName}
                        estimatedValue={estimatedValue}
                        createdAt={createdAt}
                        canEditLeads={canEditLeads}
                        canDeleteLeads={canDeleteLeads}
                        isDeleting={isDeleting}
                        isUpdating={isUpdating || membersQuery.isLoading}
                        members={membersQuery.data ?? []}
                        onStatusSelect={handleStatusSelect}
                        onAgentSelect={handleAgentSelect}
                        onView={setViewingLead}
                        onEdit={setEditingLead}
                        onDelete={onDeleteLead}
                        onCopyPhone={(phone) => {
                          void handleCopyPhone(phone);
                        }}
                      />
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <LeadsTablePagination
            table={table}
            pagination={pagination}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </div>
      </section>

      <LeadsBulkActionBar
        table={table}
        isPending={isBulkUpdating}
        isAgentsLoading={membersQuery.isLoading}
        agentOptions={membersQuery.data ?? []}
        onStatusChange={(status) =>
          handleBulkStatusUpdate(selectedLeadIds, status)
        }
        onAgentAssign={(agentId) =>
          handleBulkAgentUpdate(selectedLeadIds, agentId || null)
        }
        onClear={handleClearSelection}
      />

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
