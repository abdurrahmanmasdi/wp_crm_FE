import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { api } from '@/lib/api';
import { orgService } from '@/lib/org.service';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  CreateLeadPayload,
  Lead,
  LeadCurrency,
  LeadGender,
  LeadsMeta,
  LeadPriority,
  LeadsListResponse,
  LeadStatus,
  LeadSocialLinks,
  LeadsQueryFilters,
  UpdateLeadPayload,
} from '@/types/leads';

export type SelectOption = {
  value: string;
  label: string;
};

export type BulkUpdateLeadsPayload = {
  lead_ids: string[];
  update_data: Partial<Pick<UpdateLeadPayload, 'status' | 'assigned_agent_id'>>;
};

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

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return asString(value);
}

function asPositiveInteger(value: unknown): number | null {
  const normalized =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(normalized) || normalized < 1) {
    return null;
  }

  return Math.floor(normalized);
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

function normalizeGender(value: unknown): LeadGender {
  const normalized = asString(value)?.toUpperCase();

  if (
    normalized === 'MALE' ||
    normalized === 'FEMALE' ||
    normalized === 'OTHER' ||
    normalized === 'UNKNOWN'
  ) {
    return normalized;
  }

  return 'UNKNOWN';
}

function normalizeStatus(value: unknown): LeadStatus {
  const normalized = asString(value)?.toUpperCase();

  switch (normalized) {
    case 'OPEN':
    case 'WON':
    case 'LOST':
    case 'UNQUALIFIED':
      return normalized;
    default:
      return 'OPEN';
  }
}

function normalizePriority(value: unknown): LeadPriority {
  const normalized = asString(value)?.toUpperCase();

  switch (normalized) {
    case 'HOT':
    case 'WARM':
    case 'COLD':
      return normalized;
    default:
      return 'WARM';
  }
}

function normalizeCurrency(value: unknown): LeadCurrency {
  const normalized = asString(value)?.toUpperCase();

  switch (normalized) {
    case 'USD':
    case 'TRY':
    case 'EUR':
    case 'GBP':
      return normalized;
    default:
      return 'USD';
  }
}

function normalizeSocialLinks(value: unknown): LeadSocialLinks {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.entries(record).filter(
    ([, itemValue]) => typeof itemValue === 'string'
  ) as Array<[string, string]>;

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function normalizeLead(item: unknown): Lead {
  const record =
    item && typeof item === 'object' ? (item as Record<string, unknown>) : {};

  return {
    id: asString(record.id) ?? '',
    organization_id: asString(record.organization_id) ?? '',
    pipeline_stage_id: asNullableString(record.pipeline_stage_id),
    assigned_agent_id: asNullableString(record.assigned_agent_id),
    source_id: asNullableString(record.source_id),
    first_name: asString(record.first_name) ?? '',
    last_name: asString(record.last_name) ?? '',
    native_name: asNullableString(record.native_name),
    gender: normalizeGender(record.gender),
    email: asNullableString(record.email),
    phone_number: asString(record.phone_number) ?? '',
    country: asString(record.country) ?? '',
    timezone: asString(record.timezone) ?? '',
    primary_language: asString(record.primary_language) ?? '',
    preferred_language: asNullableString(record.preferred_language),
    social_links: normalizeSocialLinks(record.social_links),
    priority: normalizePriority(record.priority),
    status: normalizeStatus(record.status),
    estimated_value: asString(record.estimated_value) ?? '0',
    currency: normalizeCurrency(record.currency),
    expected_service_date: asNullableString(record.expected_service_date),
    next_follow_up_at: asNullableString(record.next_follow_up_at),
    created_at: asString(record.created_at) ?? '',
    updated_at: asString(record.updated_at) ?? '',
  };
}

function normalizeLeadsResponse(
  data: unknown,
  fallback: { page: number; limit: number }
): LeadsListResponse {
  const rootRecord =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(rootRecord.data)
      ? rootRecord.data
      : Array.isArray(rootRecord.items)
        ? rootRecord.items
        : Array.isArray(rootRecord.leads)
          ? rootRecord.leads
          : [];

  const normalizedData = rawList.map((item) => normalizeLead(item));
  const rawMeta =
    rootRecord.meta && typeof rootRecord.meta === 'object'
      ? (rootRecord.meta as Record<string, unknown>)
      : null;

  const page =
    asPositiveInteger(rawMeta?.page ?? rootRecord.page) ?? fallback.page;
  const limit =
    asPositiveInteger(
      rawMeta?.limit ??
        rawMeta?.per_page ??
        rawMeta?.page_size ??
        rootRecord.limit
    ) ?? fallback.limit;
  const total =
    asNonNegativeInteger(rawMeta?.total ?? rootRecord.total) ??
    normalizedData.length;

  const totalPagesFromMeta = asPositiveInteger(
    rawMeta?.totalPages ??
      rawMeta?.total_pages ??
      rootRecord.totalPages ??
      rootRecord.total_pages
  );

  const fallbackTotalPages =
    total > 0 ? Math.ceil(total / Math.max(1, limit)) : 1;

  const meta: LeadsMeta = {
    page,
    limit,
    total,
    totalPages: totalPagesFromMeta ?? fallbackTotalPages,
  };

  return {
    data: normalizedData,
    meta,
  };
}

function toQueryParams(filters?: LeadsQueryFilters): Record<string, unknown> {
  if (!filters) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => {
      if (value === null || value === undefined) {
        return false;
      }

      if (typeof value === 'string') {
        return value.trim().length > 0;
      }

      return true;
    })
  );
}

async function fetchLeads(
  orgId: string,
  filters?: LeadsQueryFilters
): Promise<LeadsListResponse> {
  const { data } = await api.get(`/organizations/${orgId}/leads`, {
    params: toQueryParams(filters),
  });

  const fallbackPage =
    typeof filters?.page === 'number' && filters.page > 0 ? filters.page : 1;
  const fallbackLimit =
    typeof filters?.limit === 'number' && filters.limit > 0
      ? filters.limit
      : 20;

  return normalizeLeadsResponse(data, {
    page: fallbackPage,
    limit: fallbackLimit,
  });
}

async function createLead(
  orgId: string,
  payload: CreateLeadPayload
): Promise<Lead> {
  const { data } = await api.post(`/organizations/${orgId}/leads`, payload);
  return normalizeLead(data);
}

async function updateLead(
  orgId: string,
  leadId: string,
  payload: UpdateLeadPayload
): Promise<Lead> {
  const { data } = await api.patch(
    `/organizations/${orgId}/leads/${leadId}`,
    payload
  );

  return normalizeLead(data);
}

async function bulkUpdateLeads(
  orgId: string,
  payload: BulkUpdateLeadsPayload
): Promise<void> {
  await api.patch(`/organizations/${orgId}/leads/bulk`, payload);
}

async function deleteLead(orgId: string, leadId: string): Promise<void> {
  await api.delete(`/organizations/${orgId}/leads/${leadId}`);
}

async function fetchOrganizationMemberOptions(
  orgId: string
): Promise<SelectOption[]> {
  const { data } = await orgService.getOrganizationMembers(orgId);

  return data
    .map((member) => {
      const userId = asString(member.user.id);
      if (!userId) {
        return null;
      }

      const fullName =
        `${member.user.firstName} ${member.user.lastName}`.trim();
      const label =
        member.user.email && member.user.email.length > 0
          ? `${fullName} (${member.user.email})`
          : fullName;

      return {
        value: userId,
        label,
      } satisfies SelectOption;
    })
    .filter((item): item is SelectOption => item !== null);
}

export function useCreateLeadMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return createLead(organizationId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.base(organizationId),
      });
    },
  });
}

export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: ({
      leadId,
      payload,
    }: {
      leadId: string;
      payload: UpdateLeadPayload;
    }) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return updateLead(organizationId, leadId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.base(organizationId),
      });
    },
  });
}

export function useBulkUpdateLeadsMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: (payload: BulkUpdateLeadsPayload) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return bulkUpdateLeads(organizationId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.base(organizationId),
      });
    },
  });
}

export function useOrganizationMembersQuery() {
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useQuery({
    queryKey: queryKeys.leads.formMembers(organizationId),
    queryFn: () => fetchOrganizationMemberOptions(organizationId!),
    enabled: Boolean(organizationId),
    retry: shouldRetryRequest,
  });
}

export function useLeads(filters?: LeadsQueryFilters) {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  const leadsQuery = useQuery({
    queryKey: queryKeys.leads.all(organizationId, toQueryParams(filters)),
    queryFn: () => fetchLeads(organizationId!, filters),
    enabled: Boolean(organizationId),
    retry: shouldRetryRequest,
  });

  const createLeadMutation = useCreateLeadMutation();
  const updateLeadMutation = useUpdateLeadMutation();

  const deleteLeadMutation = useMutation({
    mutationFn: (leadId: string) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return deleteLead(organizationId, leadId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.base(organizationId),
      });
    },
  });

  return {
    organizationId,
    leadsQuery,
    createLeadMutation,
    updateLeadMutation,
    deleteLeadMutation,
  };
}
