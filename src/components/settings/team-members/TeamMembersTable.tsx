'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Eye, MoreHorizontal, Shield } from 'lucide-react';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { AppAction, AppResource } from '@/constants/permissions.registry';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OrganizationMember } from '@/lib/org.service';
import { getLocalizedRoleName } from '@/lib/utils/translations';
import type { Role } from '@/types/access-control';

interface TeamMembersTableProps {
  members: OrganizationMember[];
  roles: Role[];
  isRoleSelectDisabled: (member: OrganizationMember) => boolean;
  isChangePending: boolean;
  onRoleChange: (membershipId: string, newRoleId: string) => void;
  onSelectMember: (member: OrganizationMember) => void;
}

function getStatusColor(status: string) {
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
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function TeamMembersTable({
  members,
  roles,
  isRoleSelectDisabled,
  isChangePending,
  onRoleChange,
  onSelectMember,
}: TeamMembersTableProps) {
  const t = useTranslations('Settings.Team');
  const locale = useLocale();

  return (
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
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(member.user.firstName, member.user.lastName)}
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

              <TableCell>
                <Badge className={`${getStatusColor(member.status)} border-0`}>
                  {member.status}
                </Badge>
              </TableCell>

              <TableCell>
                <RequirePermission
                  resource={AppResource.ROLES}
                  action={AppAction.EDIT_ALL}
                  fallback="disable"
                >
                  <Select
                    value={member.role.id}
                    onValueChange={(newRoleId) =>
                      onRoleChange(member.membershipId, newRoleId)
                    }
                    disabled={isRoleSelectDisabled(member) || isChangePending}
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
                          {getLocalizedRoleName(role, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </RequirePermission>
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t('actions')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-card border-white/10"
                  >
                    <RequirePermission
                      resource={AppResource.TEAM_MEMBERS}
                      action={AppAction.READ_ALL}
                      fallback="hide"
                    >
                      <Link href={`/dashboard/members/${member.membershipId}`}>
                        <DropdownMenuItem className="text-foreground cursor-pointer hover:bg-white/5 focus:bg-white/5">
                          <Eye className="mr-2 h-4 w-4" />
                          {t('viewDetails')}
                        </DropdownMenuItem>
                      </Link>
                    </RequirePermission>

                    <RequirePermission
                      resource={AppResource.ROLES}
                      action={AppAction.EDIT_ALL}
                      fallback="hide"
                    >
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        className="text-foreground cursor-pointer hover:bg-white/5 focus:bg-white/5"
                        onClick={() => onSelectMember(member)}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        {t('editPermissions')}
                      </DropdownMenuItem>
                    </RequirePermission>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
