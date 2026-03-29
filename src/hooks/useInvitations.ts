import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Payload for generating an invitation link for a member.
 */
export type GenerateInvitePayload = {
  email: string;
  roleId: string;
};

/**
 * Normalized response returned after creating an invitation.
 */
export type GeneratedInvite = {
  inviteUrl: string;
  token: string;
};

/**
 * Normalized pending invitation item used by UI surfaces.
 */
export type PendingInvite = {
  id: string;
  email: string;
  roleName: string;
  status: string;
  inviteUrl: string | null;
  token: string | null;
};

const ACTIVE_INVITE_STATUSES = new Set(['pending', 'active']);

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizePendingInvite(item: unknown): PendingInvite {
  const source = item && typeof item === 'object' ? item : {};
  const record = source as Record<string, unknown>;

  const roleObject =
    record.role && typeof record.role === 'object'
      ? (record.role as Record<string, unknown>)
      : null;

  const inviteUrl =
    asString(record.inviteUrl) ??
    asString(record.invite_url) ??
    asString(record.url);

  const token =
    asString(record.token) ??
    asString(record.inviteToken) ??
    asString(record.invite_token);

  return {
    id:
      asString(record.id) ??
      asString(record.invitationId) ??
      asString(record.invite_id) ??
      token ??
      `${asString(record.email) ?? 'invite'}-${Date.now()}`,
    email: asString(record.email) ?? '',
    roleName:
      asString(record.roleName) ??
      asString(record.role_name) ??
      asString(roleObject?.name) ??
      asString(roleObject?.slug) ??
      '',
    status: asString(record.status)?.toUpperCase() ?? 'PENDING',
    inviteUrl,
    token,
  };
}

function normalizePendingInvitesResponse(data: unknown): PendingInvite[] {
  const rawList = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? ((data as Record<string, unknown>).invites ??
        (data as Record<string, unknown>).items ??
        (data as Record<string, unknown>).data ??
        [])
      : [];

  if (!Array.isArray(rawList)) {
    return [];
  }

  return rawList
    .map((item) => normalizePendingInvite(item))
    .filter((invite) =>
      ACTIVE_INVITE_STATUSES.has(invite.status.toLocaleLowerCase())
    );
}

function normalizeGeneratedInvite(data: unknown): GeneratedInvite {
  const record =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

  return {
    inviteUrl: asString(record.inviteUrl) ?? asString(record.invite_url) ?? '',
    token:
      asString(record.token) ??
      asString(record.inviteToken) ??
      asString(record.invite_token) ??
      '',
  };
}

async function fetchPendingInvites(orgId: string): Promise<PendingInvite[]> {
  const { data } = await api.get(`/organizations/${orgId}/invitations`);
  return normalizePendingInvitesResponse(data);
}

async function createInvite(
  orgId: string,
  payload: GenerateInvitePayload
): Promise<GeneratedInvite> {
  const { data } = await api.post(`/organizations/${orgId}/invite`, {
    email: payload.email,
    roleId: payload.roleId,
  });

  return normalizeGeneratedInvite(data);
}

/**
 * Manages organization invitation data and invite creation mutations.
 *
 * React Query state managed:
 * - Pending invitations query scoped by active organization.
 * - Invitation creation mutation.
 *
 * Side effects:
 * - Invalidates organization invitations cache after successful invite generation.
 *
 * @returns Active organization context, invitations query state, and invite mutation handlers.
 */
export function useInvitations() {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.activeOrganizationId);

  const pendingInvitesQuery = useQuery({
    queryKey: queryKeys.organizations.invitations(organizationId),
    queryFn: () => fetchPendingInvites(organizationId!),
    enabled: Boolean(organizationId),
  });

  const generateInviteMutation = useMutation({
    mutationFn: (payload: GenerateInvitePayload) => {
      if (!organizationId) {
        throw new Error('No active organization selected.');
      }

      return createInvite(organizationId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.invitations(organizationId),
      });
    },
  });

  return {
    organizationId,
    pendingInvitesQuery,
    generateInviteMutation,
  };
}
