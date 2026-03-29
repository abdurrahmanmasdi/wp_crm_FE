import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { crmSettingsService } from '@/lib/crm-settings.service';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  CreateLeadSourcePayload,
  CreatePipelineStagePayload,
  LeadSource,
  PipelineStage,
  UpdateLeadSourcePayload,
  UpdatePipelineStagePayload,
} from '@/types/crm-settings';

function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return false;
    }
  }

  return failureCount < 3;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNonNegativeInteger(value: unknown): number | null {
  const normalized =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(normalized) || normalized < 0) {
    return null;
  }

  return Math.floor(normalized);
}

function asBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return fallback;
}

function normalizePipelineStage(item: unknown): PipelineStage | null {
  const record =
    item && typeof item === 'object' ? (item as Record<string, unknown>) : null;

  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const name = asString(record.name);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    organization_id: asString(record.organization_id) ?? '',
    name,
    order_index: asNonNegativeInteger(record.order_index) ?? 0,
    created_at: asString(record.created_at) ?? '',
    updated_at: asString(record.updated_at) ?? '',
  };
}

function normalizeLeadSource(item: unknown): LeadSource | null {
  const record =
    item && typeof item === 'object' ? (item as Record<string, unknown>) : null;

  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const name = asString(record.name);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    organization_id: asString(record.organization_id) ?? '',
    name,
    is_active: asBoolean(record.is_active),
    created_at: asString(record.created_at) ?? '',
    updated_at: asString(record.updated_at) ?? '',
  };
}

function normalizePipelineStagesResponse(data: unknown): PipelineStage[] {
  const rootRecord =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(rootRecord.data)
      ? rootRecord.data
      : Array.isArray(rootRecord.items)
        ? rootRecord.items
        : Array.isArray(rootRecord.stages)
          ? rootRecord.stages
          : [];

  return rawList
    .map((item) => normalizePipelineStage(item))
    .filter((item): item is PipelineStage => item !== null)
    .sort((a, b) => a.order_index - b.order_index);
}

function normalizeLeadSourcesResponse(data: unknown): LeadSource[] {
  const rootRecord =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(rootRecord.data)
      ? rootRecord.data
      : Array.isArray(rootRecord.items)
        ? rootRecord.items
        : Array.isArray(rootRecord.sources)
          ? rootRecord.sources
          : [];

  return rawList
    .map((item) => normalizeLeadSource(item))
    .filter((item): item is LeadSource => item !== null);
}

async function fetchPipelineStages(orgId: string): Promise<PipelineStage[]> {
  const { data } = await crmSettingsService.getPipelineStages(orgId);
  return normalizePipelineStagesResponse(data);
}

async function createPipelineStage(
  orgId: string,
  payload: CreatePipelineStagePayload
): Promise<PipelineStage> {
  const { data } = await crmSettingsService.createPipelineStage(orgId, payload);
  const normalized = normalizePipelineStage(data);

  if (!normalized) {
    throw new Error('Unexpected pipeline stage response');
  }

  return normalized;
}

async function updatePipelineStage(
  orgId: string,
  stageId: string,
  payload: UpdatePipelineStagePayload
): Promise<PipelineStage> {
  const { data } = await crmSettingsService.updatePipelineStage(
    orgId,
    stageId,
    payload
  );
  const normalized = normalizePipelineStage(data);

  if (!normalized) {
    throw new Error('Unexpected pipeline stage response');
  }

  return normalized;
}

async function deletePipelineStage(
  orgId: string,
  stageId: string
): Promise<void> {
  await crmSettingsService.deletePipelineStage(orgId, stageId);
}

async function fetchLeadSources(orgId: string): Promise<LeadSource[]> {
  const { data } = await crmSettingsService.getLeadSources(orgId);
  return normalizeLeadSourcesResponse(data);
}

async function fetchActiveLeadSources(orgId: string): Promise<LeadSource[]> {
  const { data } = await crmSettingsService.getLeadSources(orgId, {
    activeOnly: true,
  });
  return normalizeLeadSourcesResponse(data);
}

async function createLeadSource(
  orgId: string,
  payload: CreateLeadSourcePayload
): Promise<LeadSource> {
  const { data } = await crmSettingsService.createLeadSource(orgId, payload);
  const normalized = normalizeLeadSource(data);

  if (!normalized) {
    throw new Error('Unexpected lead source response');
  }

  return normalized;
}

async function updateLeadSource(
  orgId: string,
  sourceId: string,
  payload: UpdateLeadSourcePayload
): Promise<LeadSource> {
  const { data } = await crmSettingsService.updateLeadSource(
    orgId,
    sourceId,
    payload
  );
  const normalized = normalizeLeadSource(data);

  if (!normalized) {
    throw new Error('Unexpected lead source response');
  }

  return normalized;
}

async function deleteLeadSource(
  orgId: string,
  sourceId: string
): Promise<void> {
  await crmSettingsService.deleteLeadSource(orgId, sourceId);
}

export function usePipelineStagesQuery() {
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useQuery({
    queryKey: ['pipeline-stages', organizationId],
    queryFn: () => fetchPipelineStages(organizationId!),
    enabled: Boolean(organizationId),
    retry: shouldRetryRequest,
  });
}

export function useCreatePipelineStageMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: (payload: CreatePipelineStagePayload) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return createPipelineStage(organizationId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['pipeline-stages', organizationId],
      });
    },
  });
}

export function useUpdatePipelineStageMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: ({
      stageId,
      payload,
    }: {
      stageId: string;
      payload: UpdatePipelineStagePayload;
    }) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return updatePipelineStage(organizationId, stageId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['pipeline-stages', organizationId],
      });
    },
  });
}

export function useDeletePipelineStageMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: (stageId: string) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return deletePipelineStage(organizationId, stageId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['pipeline-stages', organizationId],
      });
    },
  });
}

export function useLeadSourcesQuery(options?: { activeOnly?: boolean }) {
  const organizationId = useAuthStore((state) => state.activeOrganizationId);
  const activeOnly = options?.activeOnly === true;

  return useQuery({
    queryKey: ['lead-sources', organizationId, activeOnly ? 'active' : 'all'],
    queryFn: () =>
      activeOnly
        ? fetchActiveLeadSources(organizationId!)
        : fetchLeadSources(organizationId!),
    enabled: Boolean(organizationId),
    retry: shouldRetryRequest,
  });
}

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
        queryKey: ['lead-sources', organizationId],
      });
    },
  });
}

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
        queryKey: ['lead-sources', organizationId],
      });
    },
  });
}

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
        queryKey: ['lead-sources', organizationId],
      });
    },
  });
}
