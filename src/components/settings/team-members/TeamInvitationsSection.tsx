'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { accessControlService } from '@/lib/access-control.service';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import { PendingInvitesList } from '@/components/settings/team-members/PendingInvitesList';
import { InviteMemberDialog } from '@/components/settings/team-members/InviteMemberDialog';

export function TeamInvitationsSection() {
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const rolesQuery = useQuery({
    queryKey: queryKeys.roles.all(activeOrganizationId),
    queryFn: () =>
      activeOrganizationId
        ? accessControlService.getRoles(activeOrganizationId)
        : Promise.resolve({ data: [] }),
    enabled: Boolean(activeOrganizationId),
  });

  return (
    <>
      <PendingInvitesList
        onOpenInviteDialog={() => setIsInviteDialogOpen(true)}
      />

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        roles={rolesQuery.data?.data ?? []}
        isLoadingRoles={rolesQuery.isLoading}
      />
    </>
  );
}
