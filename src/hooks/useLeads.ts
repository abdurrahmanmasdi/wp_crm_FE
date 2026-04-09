import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import {
  leadsControllerBulkUpdateV1,
  leadsControllerCreateV1,
  leadsControllerFindAllV1,
  leadsControllerRemoveV1,
  leadsControllerUpdateV1,
} from '@/api-generated/endpoints/leads';
import type {
  BulkUpdateLeadsDto,
  CreateLeadDto,
  LeadsControllerFindAllV1Params,
  UpdateLeadDto,
} from '@/api-generated/model';
import { getOrganizationMembers } from '@/lib/api/organization';
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
  UpdateLeadPayload,
} from '@/types/leads-generated';

/**
 * Generic value/label option shape used by lead form member selectors.
 */
export type SelectOption = {
  value: string;
  label: string;
};

type CreateLeadMutationPayload = CreateLeadPayload;
type UpdateLeadMutationPayload = UpdateLeadPayload;
type BulkUpdateLeadsPayload = {
  lead_ids: string[];
  update_data: Partial<
    Pick<
      UpdateLeadPayload,
      'status' | 'assigned_agent_id' | 'pipeline_stage_id'
    >
  >;
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

function asRequiredString(value: unknown, fieldName: string): string {
  const parsed = asString(value);
  if (!parsed) {
    throw new Error(`Malformed data: Missing required field "${fieldName}"`);
  }
  return parsed;
}

function asRequiredDate(value: unknown, fieldName: string): Date {
  if (!value)
    throw new Error(
      `Malformed data: Missing required date field "${fieldName}"`
    );
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Malformed data: Invalid date format for "${fieldName}"`);
  }
  return parsed;
}

function asNullableDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
    id: asRequiredString(record.id, 'id'),
    organization_id: asRequiredString(
      record.organization_id,
      'organization_id'
    ),
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
    expected_service_date: asNullableDate(record.expected_service_date),
    next_follow_up_at: asNullableDate(record.next_follow_up_at),
    created_at: asRequiredDate(record.created_at, 'created_at'),
    updated_at: asRequiredDate(record.updated_at, 'updated_at'),
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

async function fetchOrganizationMemberOptions(
  orgId: string
): Promise<SelectOption[]> {
  const data = await getOrganizationMembers(orgId);

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

/**
 * Creates single leads for the active organization using Orval-generated client calls.
 *
 * Side effects:
 * - Invalidates the organization leads base key so list queries refresh.
 *
 * @returns Mutation object for creating leads.
 */
export function useCreateLeadMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: async (payload: CreateLeadMutationPayload) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return leadsControllerCreateV1(
        organizationId,
        payload as unknown as CreateLeadDto
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.base(organizationId),
      });
    },
  });
}

/**
 * Updates a lead for the active organization using Orval-generated client calls.
 *
 * Side effects:
 * - Invalidates the organization leads base key after successful updates.
 *
 * @returns Mutation object for lead updates.
 */
export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: async ({
      leadId,
      payload,
    }: {
      leadId: string;
      payload: UpdateLeadMutationPayload;
    }) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return leadsControllerUpdateV1(
        organizationId,
        leadId,
        payload as unknown as UpdateLeadDto
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.base(organizationId),
      });
    },
  });
}

/**
 * Applies bulk updates to multiple leads using Orval-generated client calls.
 *
 * Side effects:
 * - Invalidates the organization leads base key after successful bulk mutation.
 *
 * @returns Mutation object for bulk lead updates.
 */
export function useBulkUpdateLeadsMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: async (payload: BulkUpdateLeadsPayload) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return leadsControllerBulkUpdateV1(
        organizationId,
        payload as unknown as BulkUpdateLeadsDto
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.base(organizationId),
      });
    },
  });
}

/**
 * Delete a lead for the active organization using Orval-generated client calls.
 *
 * Side effects:
 * - Invalidates the organization leads base key after successful deletion.
 *
 * @returns Mutation object for lead deletion.
 */
export function useDeleteLeadMutation() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useMutation({
    mutationFn: async (leadId: string) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return leadsControllerRemoveV1(organizationId, leadId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.base(organizationId),
      });
    },
  });
}

/**
 * Loads organization members and maps them into select options for lead forms.
 *
 * React Query state managed:
 * - Query key: `queryKeys.leads.formMembers(activeOrganizationId)`
 *
 * @returns Query result containing member select options.
 */
export function useOrganizationMembersQuery() {
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useQuery({
    queryKey: queryKeys.leads.formMembers(organizationId),
    queryFn: () => fetchOrganizationMemberOptions(organizationId!),
    enabled: Boolean(organizationId),
    retry: shouldRetryRequest,
  });
}

/**
 * Aggregates leads query state and core lead mutations for the active organization.
 * Uses Orval-generated client calls for list and mutation operations.
 *
 * React Query state managed:
 * - Leads list query keyed by organization + serialized filters.
 * - Create/update/delete mutation lifecycle for lead entities using Orval client calls.
 *
 * Side effects:
 * - All mutations invalidate the organization leads base key on success.
 *
 * @param filters Optional server-side list filters and pagination/sort settings (Orval LeadsControllerFindAllV1Params).
 * @returns Organization context, leads query, and create/update/delete mutation objects backed by Orval client calls.
 */
export function useLeads(
  filters?: LeadsControllerFindAllV1Params,
  search?: string
) {
  const organizationId = useAuthStore((state) => state.activeOrganizationId);
  const normalizedSearch = typeof search === 'string' ? search.trim() : '';
  const normalizedFilters: LeadsControllerFindAllV1Params = {
    ...(filters ?? {}),
  };
  const queryParams: Record<string, unknown> = {
    ...normalizedFilters,
    ...(normalizedSearch.length > 0 ? { search: normalizedSearch } : {}),
  };

  const leadsQuery = useQuery({
    queryKey: queryKeys.leads.all(organizationId, queryParams),
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      const data = await leadsControllerFindAllV1(
        organizationId,
        queryParams as LeadsControllerFindAllV1Params
      );

      return normalizeLeadsResponse(data as unknown, {
        page: normalizedFilters.page ?? 1,
        limit: normalizedFilters.limit ?? 20,
      });
    },
    enabled: Boolean(organizationId),
    retry: shouldRetryRequest,
  });

  const createLeadMutation = useCreateLeadMutation();
  const updateLeadMutation = useUpdateLeadMutation();
  const deleteLeadMutation = useDeleteLeadMutation();

  return {
    organizationId,
    leadsQuery,
    createLeadMutation,
    updateLeadMutation,
    deleteLeadMutation,
  };
}
