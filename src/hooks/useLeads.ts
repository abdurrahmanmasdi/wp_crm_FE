import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { api } from '@/lib/api';
import { orgService } from '@/lib/org.service';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  CreateLeadPayload,
  Lead,
  LeadCurrency,
  LeadGender,
  LeadPriority,
  LeadsListResponse,
  LeadStatus,
  LeadSocialLinks,
  LeadsQueryFilters,
} from '@/types/leads';

export type SelectOption = {
  value: string;
  label: string;
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

function normalizeLeadsResponse(data: unknown): Lead[] {
  const rawList = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? ((data as LeadsListResponse).items ??
        (data as Record<string, unknown>).leads ??
        (data as Record<string, unknown>).data ??
        [])
      : [];

  if (!Array.isArray(rawList)) {
    return [];
  }

  return rawList.map((item) => normalizeLead(item));
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
): Promise<Lead[]> {
  const { data } = await api.get(`/organizations/${orgId}/leads`, {
    params: toQueryParams(filters),
  });

  return normalizeLeadsResponse(data);
}

async function createLead(
  orgId: string,
  payload: CreateLeadPayload
): Promise<Lead> {
  const { data } = await api.post(`/organizations/${orgId}/leads`, payload);
  return normalizeLead(data);
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
        queryKey: ['leads', organizationId],
      });
    },
  });
}

export function useOrganizationMembersQuery() {
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  return useQuery({
    queryKey: ['lead-form-members', organizationId],
    queryFn: () => fetchOrganizationMemberOptions(organizationId!),
    enabled: Boolean(organizationId),
    retry: shouldRetryRequest,
  });
}

export function useLeads(filters?: LeadsQueryFilters) {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  const leadsQuery = useQuery({
    queryKey: ['leads', organizationId, toQueryParams(filters)],
    queryFn: () => fetchLeads(organizationId!, filters),
    enabled: Boolean(organizationId),
    retry: shouldRetryRequest,
  });

  const createLeadMutation = useCreateLeadMutation();

  const deleteLeadMutation = useMutation({
    mutationFn: (leadId: string) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return deleteLead(organizationId, leadId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['leads', organizationId],
      });
    },
  });

  return {
    organizationId,
    leadsQuery,
    createLeadMutation,
    deleteLeadMutation,
  };
}
