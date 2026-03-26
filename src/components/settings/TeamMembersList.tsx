'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { User, ShieldPlus } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { orgService, type OrganizationMember } from '@/lib/org.service';
import { accessControlService } from '@/lib/access-control.service';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/useAuthStore';
import { MemberPermissionsSheet } from './MemberPermissionsSheet';

export function TeamMembersList() {
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const t = useTranslations('Settings.Team');
  const tAlerts = useTranslations('Settings.Alerts');
  const tCommon = useTranslations('Common');

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

  // Determine current user's role
  const currentUserRole = useMemo(() => {
    if (!currentUser || !('id' in currentUser)) return null;
    const currentMember = members.find(
      (member) => member.user.id === currentUser.id
    );
    return currentMember?.role.name ?? null;
  }, [members, currentUser]);

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
  const isCurrentUserOwner = currentUserRole === 'Owner';

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-400';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  // Check if role select should be disabled for a member
  const isRoleSelectDisabled = (member: OrganizationMember) => {
    // Disable if the member is the Owner
    if (member.role.name === 'Owner') {
      return true;
    }
    // Disable if current user is not the Owner
    if (!isCurrentUserOwner) {
      return true;
    }
    return false;
  };

  // Get user initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
          /* Members Table */
          <div className="bg-background overflow-x-auto rounded-lg border border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">
                    {t('tableHeaders.user')}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t('tableHeaders.status')}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t('tableHeaders.role')}
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    {t('tableHeaders.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.membershipId}
                    className="border-white/5 hover:bg-white/5"
                  >
                    {/* User Column */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(
                              member.user.firstName,
                              member.user.lastName
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                          <p className="text-foreground font-medium">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Column */}
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(member.status)} border-0`}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>

                    {/* Role Column */}
                    <TableCell>
                      <Select
                        value={member.role.id}
                        onValueChange={(newRoleId) =>
                          handleRoleChange(member.membershipId, newRoleId)
                        }
                        disabled={
                          isRoleSelectDisabled(member) ||
                          changeRoleMutation.isPending
                        }
                      >
                        <SelectTrigger
                          className={`text-foreground w-40 border-white/10 ${
                            isRoleSelectDisabled(member)
                              ? 'cursor-not-allowed opacity-50'
                              : ''
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10">
                          {roles.map((role) => (
                            <SelectItem
                              key={role.id}
                              value={role.id}
                              className="text-foreground focus:text-foreground focus:bg-white/10"
                            >
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/members/${member.membershipId}`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                            title={t('viewProfile')}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                          title={t('permissionOverrides')}
                          onClick={() => setSelectedMember(member)}
                        >
                          <ShieldPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={!!pendingRoleChange} onOpenChange={cancelRoleChange}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {tAlerts('changeRoleTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {tAlerts('changeRoleDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-muted-foreground border-white/10 hover:bg-white/5">
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {tAlerts('confirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
