'use client';

import { CheckCircle2, Clock3, Mail, XCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  orgService,
  type OrganizationAccessRequest,
  type OrganizationAccessRequestsResponse,
} from '@/lib/org.service';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/useAuthStore';

type AccessRequestListItem = OrganizationAccessRequest & {
  id?: string;
  membershipId?: string;
  email?: string;
  requestedAt?: string;
  createdAt?: string;
  user?: {
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    email?: string;
  };
};

function normalizeRequests(
  data: OrganizationAccessRequestsResponse | undefined
) {
  if (Array.isArray(data)) {
    return data as AccessRequestListItem[];
  }

  if (data && typeof data === 'object') {
    return (data.requests ??
      data.memberships ??
      data.organizations ??
      []) as AccessRequestListItem[];
  }

  return [] as AccessRequestListItem[];
}

function getRequestId(request: AccessRequestListItem) {
  return request.membershipId ?? request.id ?? '';
}

function getRequestName(request: AccessRequestListItem) {
  const user = request.user;

  if (!user) {
    return 'Unknown requester';
  }

  const firstName = user.firstName ?? user.first_name ?? '';
  const lastName = user.lastName ?? user.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || user.email || request.email || 'Unknown requester';
}

function getRequestEmail(request: AccessRequestListItem) {
  return request.user?.email ?? request.email ?? 'No email provided';
}

function getRequestDate(request: AccessRequestListItem) {
  const rawDate = request.requestedAt ?? request.createdAt;

  if (!rawDate) {
    return 'Recently';
  }

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsedDate);
}

function getInitials(request: AccessRequestListItem) {
  const user = request.user;

  if (!user) {
    const fallback = getRequestEmail(request).slice(0, 2).toUpperCase();
    return fallback || 'AR';
  }

  const firstName = user.firstName ?? user.first_name ?? '';
  const lastName = user.lastName ?? user.last_name ?? '';
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  return initials || getRequestEmail(request).slice(0, 2).toUpperCase() || 'AR';
}

export function AccessRequestsList() {
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ['organization-access-requests', activeOrganizationId],
    queryFn: async () => {
      if (!activeOrganizationId) {
        return [] as AccessRequestListItem[];
      }

      const response =
        await orgService.getPendingRequests(activeOrganizationId);
      return normalizeRequests(response.data);
    },
    enabled: Boolean(activeOrganizationId),
  });

  const approveMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      if (!activeOrganizationId) {
        throw new Error('No active organization selected.');
      }

      return orgService.approveRequest(activeOrganizationId, membershipId);
    },
    onSuccess: () => {
      // Invalidating the list query is the key piece here: it forces React Query to
      // refetch the latest pending access requests immediately after a mutation
      // succeeds, which keeps the UI in sync without manual state juggling.
      toast.success('Access request approved');
      queryClient.invalidateQueries({
        queryKey: ['organization-access-requests', activeOrganizationId],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      if (!activeOrganizationId) {
        throw new Error('No active organization selected.');
      }

      return orgService.rejectRequest(activeOrganizationId, membershipId);
    },
    onSuccess: () => {
      toast.success('Access request rejected');
      queryClient.invalidateQueries({
        queryKey: ['organization-access-requests', activeOrganizationId],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const requests = useMemo(
    () => normalizeRequests(requestsQuery.data),
    [requestsQuery.data]
  );

  if (!activeOrganizationId) {
    return null;
  }

  if (requestsQuery.isLoading) {
    return (
      <section className="rounded-2xl border border-white/5 bg-[#161b22] p-6 shadow-2xl shadow-black/20">
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (requests.length === 0) {
    return (
      <section className="rounded-2xl border border-white/5 bg-[#161b22] p-8 text-center shadow-2xl shadow-black/20">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#00f0ff]/10 text-[#00f0ff]">
          <Clock3 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-[#dfe2eb]">
          No pending requests
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#859490]">
          New access requests will appear here when teammates ask to join this
          workspace.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/5 bg-[#161b22] p-6 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#00f0ff] uppercase">
            Access Requests
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#dfe2eb]">
            Review pending approvals
          </h3>
        </div>
        <span className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-semibold text-[#bacac5]">
          {requests.length} pending
        </span>
      </div>

      <div className="space-y-3">
        {requests.map((request) => {
          const requestId = getRequestId(request);
          const isApprovePending = approveMutation.isPending;
          const isRejectPending = rejectMutation.isPending;
          const isActionPending = isApprovePending || isRejectPending;

          return (
            <article
              key={
                requestId ||
                `${getRequestEmail(request)}-${getRequestDate(request)}`
              }
              className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/[0.07]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[#f9a8d4] to-[#60a5fa] text-sm font-bold text-white shadow-sm">
                    {getInitials(request)}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#dfe2eb]">
                      {getRequestName(request)}
                    </p>
                    <p className="mt-1 text-sm text-[#bacac5]">
                      {getRequestEmail(request)}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-[#859490]">
                      <Mail className="h-3.5 w-3.5" />
                      Requested {getRequestDate(request)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:pl-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => rejectMutation.mutate(requestId)}
                    disabled={isActionPending}
                    className="rounded-full"
                  >
                    {isRejectPending ? 'Rejecting...' : 'Reject'}
                    <XCircle className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    onClick={() => approveMutation.mutate(requestId)}
                    disabled={isActionPending}
                    className="rounded-full bg-[#00f0ff] text-[#003731] hover:bg-[#00f0ff]/90"
                  >
                    {isApprovePending ? 'Approving...' : 'Approve'}
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
