'use client';

import { CheckCircle2, Clock3, Mail, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  approveRequest,
  getPendingRequests,
  rejectRequest,
} from '@/lib/api/organization';
import type {
  OrganizationAccessRequest,
  OrganizationAccessRequestsResponse,
} from '@/types/organizations-generated';
import { accessControlService } from '@/lib/access-control.service';
import { getErrorMessage } from '@/lib/error-utils';
import { queryKeys } from '@/lib/query-keys';
import { getLocalizedRoleName } from '@/lib/utils/translations';
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
  return request.membershipId ?? request.membership_id ?? request.id ?? '';
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
  const locale = useLocale();
  const t = useTranslations('Settings.AccessRequests');
  const [requestToApprove, setRequestToApprove] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const requestsQuery = useQuery({
    queryKey: queryKeys.organizations.accessRequests(activeOrganizationId),
    queryFn: async () => {
      if (!activeOrganizationId) {
        return [] as AccessRequestListItem[];
      }

      const response = await getPendingRequests(activeOrganizationId);
      return normalizeRequests(response);
    },
    enabled: Boolean(activeOrganizationId),
  });

  const rolesQuery = useQuery({
    queryKey: queryKeys.roles.all(activeOrganizationId),
    queryFn: () => accessControlService.getRoles(activeOrganizationId!),
    enabled: Boolean(activeOrganizationId),
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      membershipId,
      roleId,
    }: {
      membershipId: string;
      roleId: string;
    }) => {
      if (!activeOrganizationId) {
        throw new Error('No active organization selected.');
      }

      return approveRequest(activeOrganizationId, membershipId, roleId);
    },
    onSuccess: () => {
      toast.success(t('approveSuccess'));
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.accessRequests(activeOrganizationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.members(activeOrganizationId),
      });
      setRequestToApprove(null);
      setSelectedRoleId('');
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

      return rejectRequest(activeOrganizationId, membershipId);
    },
    onSuccess: () => {
      toast.success(t('rejectSuccess'));
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.accessRequests(activeOrganizationId),
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
      <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
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
      <section className="bg-card rounded-2xl border border-white/5 p-8 text-center shadow-2xl shadow-black/20">
        <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <Clock3 className="h-6 w-6" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">
          {t('noRequests')}
        </h3>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">
          {t('noRequestsDescription')}
        </p>
      </section>
    );
  }

  return (
    <section className="bg-card space-y-4 rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-primary text-[11px] font-bold tracking-[0.2em] uppercase">
            {t('title')}
          </p>
          <h3 className="text-foreground mt-1 text-lg font-semibold">
            {t('subtitle')}
          </h3>
        </div>
        <span className="text-muted-foreground rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-semibold">
          {requests.length} {t('pending')}
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
                    <p className="text-foreground text-sm font-semibold">
                      {getRequestName(request)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {getRequestEmail(request)}
                    </p>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                      <Mail className="h-3.5 w-3.5" />
                      {t('requested', { date: getRequestDate(request) })}
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
                    {isRejectPending ? t('rejecting') : t('reject')}
                    <XCircle className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setRequestToApprove(requestId)}
                    disabled={isActionPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                  >
                    {isApprovePending ? t('approving') : t('approve')}
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Role Assignment Dialog */}
      <Dialog
        open={!!requestToApprove}
        onOpenChange={() => setRequestToApprove(null)}
      >
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t('assignRole')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('assignRoleDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-foreground text-sm font-medium">
              {t('roleLabel')}
            </label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              disabled={rolesQuery.isLoading || !rolesQuery.data}
            >
              <SelectTrigger className="text-muted-foreground mt-2 border-white/10 bg-white/5">
                <SelectValue placeholder={t('selectRolePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {rolesQuery.data?.data
                  ?.filter((role) => role.slug !== 'owner')
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {getLocalizedRoleName(role, locale)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRequestToApprove(null);
                setSelectedRoleId('');
              }}
              disabled={approveMutation.isPending}
              className="text-muted-foreground border-white/10"
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!selectedRoleId) {
                  toast.error(t('selectRoleError'));
                  return;
                }
                approveMutation.mutate({
                  membershipId: requestToApprove || '',
                  roleId: selectedRoleId,
                });
              }}
              disabled={approveMutation.isPending || !selectedRoleId}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {approveMutation.isPending
                ? t('confirming')
                : t('confirmApproval')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
