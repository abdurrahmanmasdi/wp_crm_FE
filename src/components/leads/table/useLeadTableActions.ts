'use client';

import { useCallback, useMemo, useState } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { AppAction, AppResource } from '@/constants/permissions.registry';
import { useLeadSourcesQuery } from '@/hooks/useCrmSettings';
import {
  useBulkUpdateLeadsMutation,
  useOrganizationMembersQuery,
  useUpdateLeadMutation,
} from '@/hooks/useLeads';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/error-utils';
import { leadsControllerExportAllV1 } from '@/api-generated/endpoints';
import { exportLeadsToCSV } from '@/utils/csv-export';
import type {
  LeadStatus,
  LeadWithRelations,
  LeadSortBy,
  LeadSortDir,
  Lead,
  LeadsListResponse,
} from '@/types/leads-generated';

type UpdateLeadPayload = {
  status?: LeadStatus;
  assigned_agent_id?: string | null;
};

type ExportParams = {
  organizationId: string;
  filters?: string;
  search?: string;
  sortBy?: LeadSortBy;
  sortDir?: LeadSortDir;
};

type LeadsExportResponse =
  | Lead[]
  | Pick<LeadsListResponse, 'data'>
  | { items?: Lead[]; leads?: Lead[] };

function extractLeadsFromResponse(data: LeadsExportResponse): Lead[] {
  if (Array.isArray(data)) {
    return data;
  }

  const record = data as {
    data?: Lead[];
    items?: Lead[];
    leads?: Lead[];
  };

  if (Array.isArray(record.data)) {
    return record.data;
  }

  if (Array.isArray(record.items)) {
    return record.items;
  }

  if (Array.isArray(record.leads)) {
    return record.leads;
  }

  return [];
}

function getAgentDisplayName(label: string): string {
  return label.split(' (')[0] || label;
}

export function useLeadTableActions() {
  const t = useTranslations('Leads');
  const { hasPermission } = usePermissions();
  const membersQuery = useOrganizationMembersQuery();
  const leadSourcesQuery = useLeadSourcesQuery();
  const updateLeadMutation = useUpdateLeadMutation();
  const bulkUpdateLeadsMutation = useBulkUpdateLeadsMutation();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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

  const handleInlineUpdate = async (
    leadId: string,
    payload: UpdateLeadPayload
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

  const handleStatusSelect = async (
    lead: LeadWithRelations,
    status: LeadStatus
  ) => {
    if (lead.status === status) {
      return;
    }

    await handleInlineUpdate(lead.id, { status });
  };

  const handleAgentSelect = async (
    lead: LeadWithRelations,
    assignedAgentId: string | null
  ) => {
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

  const handleClearSelection = () => {
    setRowSelection({});
  };

  const handleBulkStatusUpdate = async (
    selectedLeadIds: string[],
    status: LeadStatus
  ) => {
    if (selectedLeadIds.length === 0) {
      return;
    }

    try {
      await bulkUpdateLeadsMutation.mutateAsync({
        lead_ids: selectedLeadIds,
        update_data: { status },
      });

      toast.success(
        t('bulkBar.statusUpdatedSuccess', {
          count: selectedLeadIds.length,
        })
      );
      setRowSelection({});
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError) || t('bulkBar.updateError'));
    }
  };

  const handleBulkAgentUpdate = async (
    selectedLeadIds: string[],
    assignedAgentId: string | null
  ) => {
    if (selectedLeadIds.length === 0) {
      return;
    }

    try {
      await bulkUpdateLeadsMutation.mutateAsync({
        lead_ids: selectedLeadIds,
        update_data: {
          assigned_agent_id: assignedAgentId,
        },
      });

      toast.success(
        t('bulkBar.agentUpdatedSuccess', {
          count: selectedLeadIds.length,
        })
      );
      setRowSelection({});
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError) || t('bulkBar.updateError'));
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = useCallback(
    async (exportParams: ExportParams) => {
      if (isExporting) {
        return;
      }

      try {
        setIsExporting(true);

        const exportQueryParams: Record<string, string | undefined> = {
          filters: exportParams.filters,
          search: exportParams.search,
        };

        // Construct sorts parameter if sortBy and sortDir are provided
        if (exportParams.sortBy && exportParams.sortDir) {
          const sortsArray = [
            {
              field: exportParams.sortBy,
              direction: exportParams.sortDir,
            },
          ];
          exportQueryParams.sorts = JSON.stringify(sortsArray);
        }

        // Filter out undefined values
        const filteredParams = Object.fromEntries(
          Object.entries(exportQueryParams).filter(
            ([, value]) => value !== undefined && value !== ''
          )
        ) as Record<string, string>;

        const response = await leadsControllerExportAllV1(
          exportParams.organizationId,
          filteredParams
        );

        const leadsForExport = extractLeadsFromResponse(response.data);

        if (leadsForExport.length === 0) {
          toast.error(t('export.empty'));
          return;
        }

        exportLeadsToCSV(leadsForExport);
        toast.success(
          t('export.success', {
            count: leadsForExport.length,
          })
        );
      } catch (error) {
        toast.error(getErrorMessage(error) || t('export.error'));
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, t]
  );

  return {
    rowSelection,
    setRowSelection,
    canEditLeads,
    canDeleteLeads,
    sourceLabelMap,
    agentLabelMap,
    membersQuery,
    updatingLeadId,
    isBulkUpdating: bulkUpdateLeadsMutation.isPending,
    isExporting,
    handleStatusSelect,
    handleAgentSelect,
    handleCopyPhone,
    handleClearSelection,
    handleBulkStatusUpdate,
    handleBulkAgentUpdate,
    handleExportCsv,
    getAgentDisplayName,
  };
}
