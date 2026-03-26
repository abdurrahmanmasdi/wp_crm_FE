'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

import { orgService, type OrganizationMember } from '@/lib/org.service';
import { accessControlService } from '@/lib/access-control.service';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/store/useAuthStore';

export function TeamMembersList() {
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

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
      toast.success('Member role updated successfully');
      queryClient.invalidateQueries({
        queryKey: ['members', activeOrganizationId],
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    },
  });

  const handleRoleChange = (membershipId: string, roleId: string) => {
    changeRoleMutation.mutate({ membershipId, roleId });
  };

  const handleProfileClick = () => {
    toast.info('Profile view coming soon.');
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
        <div className="flex min-h-60 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-[#0a0e14] px-6 text-center">
          <div className="max-w-md space-y-3">
            <p className="text-xs font-bold tracking-[0.2em] text-red-400 uppercase">
              Error
            </p>
            <h2 className="text-xl font-semibold text-[#dfe2eb]">
              Failed to load team members
            </h2>
            <p className="text-sm leading-6 text-[#bacac5]">
              {getErrorMessage(error)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-white/5 bg-[#161b22] p-8 shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#dfe2eb]">Team Members</h2>
          <p className="mt-1 text-sm text-[#bacac5]">
            Manage organization members and their roles
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-[#0a0e14] px-6 py-12">
            <p className="text-sm text-[#bacac5]">Loading team members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-[#0a0e14] px-6 text-center">
            <div className="max-w-md space-y-2">
              <p className="text-sm text-[#bacac5]">No team members yet.</p>
              <p className="text-xs text-[#8b949e]">
                Team members will appear here once added to the organization
              </p>
            </div>
          </div>
        ) : (
          /* Members Table */
          <div className="overflow-x-auto rounded-lg border border-white/5 bg-[#0a0e14]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[#bacac5]">User</TableHead>
                  <TableHead className="text-[#bacac5]">Status</TableHead>
                  <TableHead className="text-[#bacac5]">Role</TableHead>
                  <TableHead className="text-right text-[#bacac5]">
                    Actions
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
                          <AvatarFallback className="bg-[#00f0ff]/10 font-semibold text-[#00f0ff]">
                            {getInitials(
                              member.user.firstName,
                              member.user.lastName
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-[#dfe2eb]">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-xs text-[#8b949e]">
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
                          className={`w-40 border-white/10 text-[#dfe2eb] ${
                            isRoleSelectDisabled(member)
                              ? 'cursor-not-allowed opacity-50'
                              : ''
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#0a0e14]">
                          {roles.map((role) => (
                            <SelectItem
                              key={role.id}
                              value={role.id}
                              className="text-[#dfe2eb] focus:bg-white/10 focus:text-[#dfe2eb]"
                            >
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleProfileClick}
                        className="text-[#bacac5] hover:bg-white/5 hover:text-[#dfe2eb]"
                      >
                        Profile (In Dev)
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </>
  );
}
