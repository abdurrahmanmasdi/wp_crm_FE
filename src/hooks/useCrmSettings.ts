import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import {
  createLeadSource,
  deleteLeadSource,
  getLeadSources,
  updateLeadSource,
} from '@/lib/api/crm-settings';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  CreateLeadSourcePayload,
  LeadSource,
  UpdateLeadSourcePayload,
} from '@/types/crm-settings-generated';

function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return false;
    }
  }

  return failureCount < 3;
}

async function fetchLeadSources(orgId: string): Promise<LeadSource[]> {
  return getLeadSources(orgId);
}

async function fetchActiveLeadSources(orgId: string): Promise<LeadSource[]> {
  return getLeadSources(orgId, {
    activeOnly: true,
  });
}

/**
 * Loads lead sources for the active organization.
 *
 * React Query state managed:
 * - Query key: `queryKeys.crmSettings.leadSources(activeOrganizationId, scope)`
 * - Scope can be `active` only or `all`.
 *
 * @param options Optional query behavior flags such as `activeOnly`.
 * @returns Query result for normalized lead source records.
 */
export function useLeadSourcesQuery(options?: { activeOnly?: boolean }) {
  const organizationId = useAuthStore((state) => state.activeOrganizationId);
  const activeOnly = options?.activeOnly === true;

  return useQuery({
    queryKey: queryKeys.crmSettings.leadSources(
      organizationId,
      activeOnly ? 'active' : 'all'
    ),
    queryFn: () =>
      activeOnly
        ? fetchActiveLeadSources(organizationId!)
        : fetchLeadSources(organizationId!),
    enabled: Boolean(organizationId),
    retry: shouldRetryRequest,
  });
}

/**
 * Creates a lead source for the active organization.
 *
 * Side effects:
 * - Invalidates lead source base cache key so all lead source scopes refresh.
 *
 * @returns Mutation object for lead source creation.
 */
export function useCreateLeadSourceMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: (payload: CreateLeadSourcePayload) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return createLeadSource(organizationId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.crmSettings.leadSourcesBase(organizationId),
      });
    },
  });
}

/**
 * Updates a lead source for the active organization.
 *
 * Side effects:
 * - Invalidates lead source base cache key so all lead source scopes refresh.
 *
 * @returns Mutation object for lead source updates.
 */
export function useUpdateLeadSourceMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: ({
      sourceId,
      payload,
    }: {
      sourceId: string;
      payload: UpdateLeadSourcePayload;
    }) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return updateLeadSource(organizationId, sourceId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.crmSettings.leadSourcesBase(organizationId),
      });
    },
  });
}

/**
 * Deletes a lead source for the active organization.
 *
 * Side effects:
 * - Invalidates lead source base cache key so all lead source scopes refresh.
 *
 * @returns Mutation object for lead source deletion.
 */
export function useDeleteLeadSourceMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: (sourceId: string) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return deleteLeadSource(organizationId, sourceId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.crmSettings.leadSourcesBase(organizationId),
      });
    },
  });
}
