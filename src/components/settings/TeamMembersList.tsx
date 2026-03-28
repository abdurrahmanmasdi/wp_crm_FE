'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { orgService, type OrganizationMember } from '@/lib/org.service';
import { accessControlService } from '@/lib/access-control.service';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/useAuthStore';
import { MemberPermissionsSheet } from './MemberPermissionsSheet';
import { TeamMembersTable } from '@/components/settings/team-members/TeamMembersTable';
import { RoleChangeConfirmationDialog } from '@/components/settings/team-members/RoleChangeConfirmationDialog';

export function TeamMembersList() {
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const t = useTranslations('Settings.Team');

  // State for pending role change confirmation
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    membershipId: string;
    newRoleId: string;
  } | null>(null);

  // State for permission sheet
  const [selectedMember, setSelectedMember] =
    useState<OrganizationMember | null>(null);

  // Fetch members and roles in parallel
  const {
    data: membersData,
    isLoading: isMembersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ['members', activeOrganizationId],
    queryFn: () =>
      activeOrganizationId
        ? orgService.getOrganizationMembers(activeOrganizationId)
        : Promise.resolve({ data: [] }),
    enabled: !!activeOrganizationId,
  });

  const {
    data: rolesData,
    isLoading: isRolesLoading,
    error: rolesError,
  } = useQuery({
    queryKey: ['roles', activeOrganizationId],
    queryFn: () =>
      activeOrganizationId
        ? accessControlService.getRoles(activeOrganizationId)
        : Promise.resolve({ data: [] }),
    enabled: !!activeOrganizationId,
  });

  const members = membersData?.data ?? [];
  const roles = rolesData?.data ?? [];
  const isLoading = isMembersLoading || isRolesLoading;
  const error = membersError || rolesError;

  // Determine current user's role slug
  const currentUserRoleSlug = useMemo(() => {
    if (!currentUser || !('id' in currentUser)) return null;
    const membersList = membersData?.data ?? [];
    const currentMember = membersList.find(
      (member) => member.user.id === currentUser.id
    );
    return currentMember?.role.slug ?? null;
  }, [membersData?.data, currentUser]);

  // Change member role mutation
  const changeRoleMutation = useMutation({
    mutationFn: (params: { membershipId: string; roleId: string }) =>
      activeOrganizationId
        ? accessControlService.changeMemberRole(
            activeOrganizationId,
            params.membershipId,
            params.roleId
          )
        : Promise.reject(new Error('No organization selected')),
    onSuccess: () => {
      toast.success(t('roleUpdateSuccess'));
      queryClient.invalidateQueries({
        queryKey: ['members', activeOrganizationId],
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    },
  });

  const handleRoleChange = (membershipId: string, newRoleId: string) => {
    setPendingRoleChange({ membershipId, newRoleId });
  };

  const confirmRoleChange = () => {
    if (pendingRoleChange) {
      changeRoleMutation.mutate({
        membershipId: pendingRoleChange.membershipId,
        roleId: pendingRoleChange.newRoleId,
      });
      setPendingRoleChange(null);
    }
  };

  const cancelRoleChange = () => {
    setPendingRoleChange(null);
  };

  // Check if current user is owner
  const isCurrentUserOwner = currentUserRoleSlug === 'owner';

  // Check if role select should be disabled for a member
  const isRoleSelectDisabled = (member: OrganizationMember) => {
    // Disable if the member is the owner role.
    if (member.role.slug === 'owner') {
      return true;
    }
    // Disable if current user is not the Owner
    if (!isCurrentUserOwner) {
      return true;
    }
    return false;
  };

  if (error) {
    return (
      <section className="rounded-2xl border border-white/5 bg-[#161b22] p-8 shadow-2xl shadow-black/20">
        <div className="bg-background flex min-h-60 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 px-6 text-center">
          <div className="max-w-md space-y-3">
            <p className="text-xs font-bold tracking-[0.2em] text-red-400 uppercase">
              Error
            </p>
            <h2 className="text-foreground text-xl font-semibold">
              Failed to load team members
            </h2>
            <p className="text-muted-foreground text-sm leading-6">
              {getErrorMessage(error)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-card rounded-2xl border border-white/5 p-8 shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-foreground text-lg font-semibold">
            {t('title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-background flex items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 px-6 py-12">
            <p className="text-muted-foreground text-sm">{t('loading')}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-background flex min-h-40 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 px-6 text-center">
            <div className="max-w-md space-y-2">
              <p className="text-muted-foreground text-sm">{t('noMembers')}</p>
              <p className="text-muted-foreground/70 text-xs">
                {t('noMembersHint')}
              </p>
            </div>
          </div>
        ) : (
          <TeamMembersTable
            members={members}
            roles={roles}
            isRoleSelectDisabled={isRoleSelectDisabled}
            isChangePending={changeRoleMutation.isPending}
            onRoleChange={handleRoleChange}
            onSelectMember={setSelectedMember}
          />
        )}
      </section>

      <RoleChangeConfirmationDialog
        open={!!pendingRoleChange}
        onCancel={cancelRoleChange}
        onConfirm={confirmRoleChange}
      />

      {/* Member Permissions Sheet */}
      <MemberPermissionsSheet
        isOpen={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
        member={selectedMember}
      />
    </>
  );
}
